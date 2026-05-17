import { NextResponse } from 'next/server';
import { PaymentStatus } from '@prisma/client';
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
import { canTransitionPaymentStatus } from '@/lib/security/status-transitions';

const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];

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
          action: 'payment.status.update',
          outcome: 'DENY',
          requestId,
          reason: 'unauthenticated',
        });
        return auth.response;
      }

      actorId = auth.context.userId;
      actorRole = auth.context.role;
      tenantIdForAudit = auth.context.tenantId;

      const roleCheck = requireRole(auth.context, ['owner', 'admin']);
      if (!roleCheck.ok) {
        logAuditEvent({
          action: 'payment.status.update',
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
        bucket: 'payment:update-status',
        identity: `${auth.context.tenantId}:${auth.context.userId}`,
        limit: 20,
        windowMs: 60_000,
      });
      if (!rateLimit.ok) {
        logAuditEvent({
          action: 'payment.status.update',
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
          action: 'payment.status.update',
          outcome: 'DENY',
          requestId,
          actorId,
          actorRole,
          tenantId: tenantIdForAudit,
          reason: 'tenant_mismatch',
        });
        return tenantCheck.response;
      }

      const paymentId = requireString(parsedBody.data.paymentId, 'paymentId');
      if (!paymentId.ok) return paymentId.response;

      const nextStatus = requireEnum(parsedBody.data.status, 'status', PAYMENT_STATUSES);
      if (!nextStatus.ok) return nextStatus.response;

      requireDatabaseUrl();

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId.data },
        select: { id: true, tenantId: true, status: true, transactionId: true },
      });
      if (!payment) {
        return errorResponse(404, 'NOT_FOUND', 'Payment not found');
      }
      if (payment.tenantId !== tenantCheck.tenantId) {
        return errorResponse(403, 'FORBIDDEN', 'Payment tenant does not match authenticated tenant');
      }

      if (!canTransitionPaymentStatus(payment.status, nextStatus.data)) {
        logAuditEvent({
          action: 'payment.status.update',
          outcome: 'DENY',
          requestId,
          actorId,
          actorRole,
          tenantId: payment.tenantId,
          targetType: 'payment',
          targetId: payment.id,
          reason: `illegal_transition_${payment.status}_to_${nextStatus.data}`,
        });
        return errorResponse(409, 'CONFLICT', `Illegal payment transition: ${payment.status} -> ${nextStatus.data}`);
      }

      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: nextStatus.data },
        select: { id: true, tenantId: true, status: true, updatedAt: true },
      });

      logAuditEvent({
        action: 'payment.status.update',
        outcome: 'SUCCESS',
        requestId,
        actorId,
        actorRole,
        tenantId: updated.tenantId,
        targetType: 'payment',
        targetId: updated.id,
      });

      return NextResponse.json({ payment: updated });
    });
  } catch (error) {
    logAuditEvent({
      action: 'payment.status.update',
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
