import { NextResponse } from 'next/server';
import { BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/security/auth';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { enforceTenantContext } from '@/lib/security/tenant';
import { errorResponse, unknownErrorResponse } from '@/lib/security/http';
import { optionalString, parseJsonBody, requireEnum, requireString } from '@/lib/security/validation';
import { requireDatabaseUrl } from '@/lib/security/config';
import { getRequestId } from '@/lib/security/request-context';
import { logAuditEvent } from '@/lib/security/audit-log';
import { withRequestTimeout } from '@/lib/security/timeout';
import { canTransitionBookingStatus } from '@/lib/security/status-transitions';

const BOOKING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];
const MIN_CANCEL_LEAD_MINUTES = 15;

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
          action: 'booking.status.update',
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
          action: 'booking.status.update',
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
        bucket: 'booking:update-status',
        identity: `${auth.context.tenantId}:${auth.context.userId}`,
        limit: 30,
        windowMs: 60_000,
      });
      if (!rateLimit.ok) {
        logAuditEvent({
          action: 'booking.status.update',
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
          action: 'booking.status.update',
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

      const nextStatus = requireEnum(parsedBody.data.status, 'status', BOOKING_STATUSES);
      if (!nextStatus.ok) return nextStatus.response;

      requireDatabaseUrl();

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId.data },
        select: { id: true, tenantId: true, status: true, startTime: true },
      });
      if (!booking) {
        return errorResponse(404, 'NOT_FOUND', 'Booking not found');
      }
      if (booking.tenantId !== tenantCheck.tenantId) {
        return errorResponse(403, 'FORBIDDEN', 'Booking tenant does not match authenticated tenant');
      }

      if (!canTransitionBookingStatus(booking.status, nextStatus.data)) {
        logAuditEvent({
          action: 'booking.status.update',
          outcome: 'DENY',
          requestId,
          actorId,
          actorRole,
          tenantId: booking.tenantId,
          targetType: 'booking',
          targetId: booking.id,
          reason: `illegal_transition_${booking.status}_to_${nextStatus.data}`,
        });
        return errorResponse(409, 'CONFLICT', `Illegal booking transition: ${booking.status} -> ${nextStatus.data}`);
      }

      if (booking.status === 'CONFIRMED' && nextStatus.data === 'CANCELLED') {
        const minutesToStart = Math.floor((booking.startTime.getTime() - Date.now()) / 60_000);
        if (minutesToStart < MIN_CANCEL_LEAD_MINUTES) {
          logAuditEvent({
            action: 'booking.status.update',
            outcome: 'DENY',
            requestId,
            actorId,
            actorRole,
            tenantId: booking.tenantId,
            targetType: 'booking',
            targetId: booking.id,
            reason: 'cancellation_window_locked',
          });
          return errorResponse(409, 'CONFLICT', 'Cancellation window is locked for this booking');
        }
      }

      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: { status: nextStatus.data },
        select: { id: true, tenantId: true, status: true, updatedAt: true },
      });

      logAuditEvent({
        action: 'booking.status.update',
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
    logAuditEvent({
      action: 'booking.status.update',
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
