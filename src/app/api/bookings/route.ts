import { NextResponse } from 'next/server';
import { BookingStatus } from '@prisma/client';
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

const BLOCKING_BOOKING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED'];

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
          action: 'booking.create',
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
          action: 'booking.create',
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
        bucket: 'booking:create',
        identity: `${auth.context.tenantId}:${auth.context.userId}`,
        limit: 30,
        windowMs: 60_000,
      });
      if (!rateLimit.ok) {
        logAuditEvent({
          action: 'booking.create',
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
          action: 'booking.create',
          outcome: 'DENY',
          requestId,
          actorId,
          actorRole,
          tenantId: tenantIdForAudit,
          reason: 'tenant_mismatch',
        });
        return tenantCheck.response;
      }

      const serviceId = requireString(parsedBody.data.serviceId, 'serviceId');
      if (!serviceId.ok) return serviceId.response;

      const userId = optionalString(parsedBody.data.userId, 'userId');
      if (!userId.ok) return userId.response;

      const startTime = requireIsoDate(parsedBody.data.startTime, 'startTime');
      if (!startTime.ok) return startTime.response;

      const endTime = requireIsoDate(parsedBody.data.endTime, 'endTime');
      if (!endTime.ok) return endTime.response;

      const notes = optionalString(parsedBody.data.notes, 'notes');
      if (!notes.ok) return notes.response;

      const start = startTime.data;
      const end = endTime.data;
      if (start >= end) {
        return errorResponse(400, 'INVALID_REQUEST', 'startTime must be before endTime');
      }

      const tenantId = tenantCheck.tenantId;
      requireDatabaseUrl();

      const service = await prisma.service.findUnique({
        where: { id: serviceId.data },
        select: { id: true, tenantId: true, isActive: true },
      });
      if (!service || service.tenantId !== tenantId) {
        return errorResponse(404, 'NOT_FOUND', 'Service not found');
      }
      if (!service.isActive) {
        return errorResponse(400, 'INVALID_REQUEST', 'Service is not active');
      }

      if (userId.data) {
        const user = await prisma.user.findUnique({
          where: { id: userId.data },
          select: { id: true, tenantId: true },
        });
        if (!user || user.tenantId !== tenantId) {
          return errorResponse(404, 'NOT_FOUND', 'User not found');
        }
      }

      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          tenantId,
          serviceId: service.id,
          status: { in: BLOCKING_BOOKING_STATUSES },
          startTime: { lt: end },
          endTime: { gt: start },
        },
        select: { id: true, startTime: true, endTime: true },
      });

      if (conflictingBooking) {
        logAuditEvent({
          action: 'booking.create',
          outcome: 'DENY',
          requestId,
          actorId,
          actorRole,
          tenantId,
          targetType: 'booking',
          targetId: conflictingBooking.id,
          reason: 'conflict_existing_slot',
        });
        return errorResponse(409, 'CONFLICT', 'Booking time slot is not available');
      }

      const booking = await prisma.booking.create({
        data: {
          tenantId,
          serviceId: service.id,
          userId: userId.data,
          startTime: start,
          endTime: end,
          notes: notes.data,
          status: 'PENDING',
        },
        select: {
          id: true,
          tenantId: true,
          serviceId: true,
          userId: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      });

      logAuditEvent({
        action: 'booking.create',
        outcome: 'SUCCESS',
        requestId,
        actorId,
        actorRole,
        tenantId,
        targetType: 'booking',
        targetId: booking.id,
      });

      return NextResponse.json({ booking }, { status: 201 });
    });
  } catch (error) {
    if (isBookingOverlapConstraintError(error)) {
      return errorResponse(409, 'CONFLICT', 'Booking time slot is not available');
    }

    logAuditEvent({
      action: 'booking.create',
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
