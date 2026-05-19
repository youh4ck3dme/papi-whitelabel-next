import { BookingStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/security/auth';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { enforceTenantContext } from '@/lib/security/tenant';
import { errorResponse, unknownErrorResponse } from '@/lib/security/http';
import { optionalString, parseJsonBody, requireIsoDate, requireString } from '@/lib/security/validation';
import { requireDatabaseUrl } from '@/lib/security/config';
import { getRequestId } from '@/lib/security/request-context';
import { logAuditEvent } from '@/lib/security/audit-log';
import { withRequestTimeout } from '@/lib/security/timeout';
import { isBookingOverlapConstraintError } from '@/lib/security/prisma-errors';

const RESCHEDULABLE_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED'];
const BLOCKING_BOOKING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED'];
const MIN_RESCHEDULE_LEAD_MINUTES = 15;

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  let actorId: string | undefined;
  let actorRole: string | undefined;
  let tenantIdForAudit: string | undefined;

  try {
    return await withRequestTimeout(15_000, async () => {
      const auth = await requireAuth(request);
      if (!auth.ok) {
        logAuditEvent({
          action: 'booking.reschedule',
          outcome: 'DENY',
          requestId,
          reason: 'unauthenticated',
        });
        return auth.response;
      }

      actorId = auth.context.userId;
      actorRole = auth.context.role;
      tenantIdForAudit = auth.context.tenantId;

      const roleCheck = requireRole(auth.context, ['owner', 'admin', 'staff']);
      if (!roleCheck.ok) {
        logAuditEvent({
          action: 'booking.reschedule',
          outcome: 'DENY',
          requestId,
          actorId,
          actorRole,
          tenantId: tenantIdForAudit,
          reason: 'role_forbidden',
        });
        return roleCheck.response;
      }

      const rateLimit = enforceRateLimit({
        request,
        bucket: 'booking:reschedule',
        identity: `${auth.context.tenantId}:${auth.context.userId}`,
        limit: 30,
        windowMs: 60_000,
      });
      if (!rateLimit.ok) {
        logAuditEvent({
          action: 'booking.reschedule',
          outcome: 'DENY',
          requestId,
          actorId,
          actorRole,
          tenantId: tenantIdForAudit,
          reason: 'rate_limited',
        });
        return rateLimit.response;
      }

      const parsedBody = await parseJsonBody(request);
      if (!parsedBody.ok) return parsedBody.response;

      const tenantIdInput = optionalString(parsedBody.data.tenantId, 'tenantId');
      if (!tenantIdInput.ok) return tenantIdInput.response;

      const tenantCheck = enforceTenantContext(tenantIdInput.data, auth.context);
      if (!tenantCheck.ok) {
        logAuditEvent({
          action: 'booking.reschedule',
          outcome: 'DENY',
          requestId,
          actorId,
          actorRole,
          tenantId: tenantIdForAudit,
          reason: 'tenant_mismatch',
        });
        return tenantCheck.response;
      }

      const bookingId = requireString(parsedBody.data.bookingId, 'bookingId');
      if (!bookingId.ok) return bookingId.response;

      const startTime = requireIsoDate(parsedBody.data.startTime, 'startTime');
      if (!startTime.ok) return startTime.response;

      const endTime = requireIsoDate(parsedBody.data.endTime, 'endTime');
      if (!endTime.ok) return endTime.response;

      const newStart = startTime.data;
      const newEnd = endTime.data;
      if (newStart >= newEnd) {
        return errorResponse(400, 'INVALID_REQUEST', 'startTime must be before endTime');
      }

      const now = Date.now();
      const minutesUntilNewStart = Math.floor((newStart.getTime() - now) / 60_000);
      if (minutesUntilNewStart < MIN_RESCHEDULE_LEAD_MINUTES) {
        return errorResponse(409, 'CONFLICT', 'Reschedule window is locked for near-term slots');
      }

      requireDatabaseUrl();

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId.data },
        select: {
          id: true,
          tenantId: true,
          serviceId: true,
          status: true,
          startTime: true,
          endTime: true,
        },
      });
      if (!booking) {
        return errorResponse(404, 'NOT_FOUND', 'Booking not found');
      }
      if (booking.tenantId !== tenantCheck.tenantId) {
        return errorResponse(403, 'FORBIDDEN', 'Booking tenant does not match authenticated tenant');
      }
      if (!RESCHEDULABLE_STATUSES.includes(booking.status)) {
        return errorResponse(409, 'CONFLICT', `Booking in status ${booking.status} cannot be rescheduled`);
      }

      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          id: { not: booking.id },
          tenantId: booking.tenantId,
          serviceId: booking.serviceId,
          status: { in: BLOCKING_BOOKING_STATUSES },
          startTime: { lt: newEnd },
          endTime: { gt: newStart },
        },
        select: { id: true },
      });

      if (conflictingBooking) {
        logAuditEvent({
          action: 'booking.reschedule',
          outcome: 'DENY',
          requestId,
          actorId,
          actorRole,
          tenantId: booking.tenantId,
          targetType: 'booking',
          targetId: conflictingBooking.id,
          reason: 'conflict_existing_slot',
        });
        return errorResponse(409, 'CONFLICT', 'Booking time slot is not available');
      }

      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          startTime: newStart,
          endTime: newEnd,
        },
        select: {
          id: true,
          tenantId: true,
          serviceId: true,
          status: true,
          startTime: true,
          endTime: true,
          updatedAt: true,
        },
      });

      logAuditEvent({
        action: 'booking.reschedule',
        outcome: 'SUCCESS',
        requestId,
        actorId,
        actorRole,
        tenantId: updated.tenantId,
        targetType: 'booking',
        targetId: updated.id,
      });

      return NextResponse.json({ booking: updated });
    });
  } catch (error) {
    if (isBookingOverlapConstraintError(error)) {
      return errorResponse(409, 'CONFLICT', 'Booking time slot is not available');
    }

    logAuditEvent({
      action: 'booking.reschedule',
      outcome: 'ERROR',
      requestId,
      actorId,
      actorRole,
      tenantId: tenantIdForAudit,
      reason: 'unhandled_exception',
    });
    return unknownErrorResponse(error);
  }
}
