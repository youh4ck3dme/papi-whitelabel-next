import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';
import { requireAuth, requireRole } from '@/lib/security/auth';
import { errorResponse, unknownErrorResponse } from '@/lib/security/http';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { enforceTenantContext } from '@/lib/security/tenant';
import { optionalString, parseJsonBody, requireEnum, requireString } from '@/lib/security/validation';
import { requireDatabaseUrl, requireNextAuthUrl, requireStripePriceId } from '@/lib/security/config';
import { getRequestId } from '@/lib/security/request-context';
import { logAuditEvent } from '@/lib/security/audit-log';

const PLAN_VALUES = ['STARTER', 'PRO', 'ENTERPRISE'] as const;

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  let actorId: string | undefined;
  let actorRole: string | undefined;
  let tenantIdForAudit: string | undefined;

  try {
    const auth = await requireAuth(request);
    if (!auth.ok) {
      logAuditEvent({
        action: 'subscription.create',
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
        action: 'subscription.create',
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
      bucket: 'billing:create-subscription',
      identity: `${auth.context.tenantId}:${auth.context.userId}`,
      limit: 10,
      windowMs: 60_000,
    });
    if (!rateLimit.ok) {
      logAuditEvent({
        action: 'subscription.create',
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
        action: 'subscription.create',
        outcome: 'DENY',
        requestId,
        actorId,
        actorRole,
        tenantId: tenantIdForAudit,
        reason: 'tenant_mismatch',
      });
      return tenantCheck.response;
    }

    const plan = requireEnum(parsedBody.data.plan, 'plan', PLAN_VALUES);
    if (!plan.ok) return plan.response;

    const email = requireString(parsedBody.data.email, 'email', {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      maxLength: 320,
    });
    if (!email.ok) return email.response;

    const tenantId = tenantCheck.tenantId;
    requireDatabaseUrl();

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return errorResponse(404, 'NOT_FOUND', 'Tenant not found');
    }

    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const stripe = getStripeClient();
      const customer = await stripe.customers.create({
        email: email.data,
        metadata: { tenantId },
      });
      customerId = customer.id;
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { stripeCustomerId: customerId },
      });
    }

    const priceId = requireStripePriceId(plan.data);
    const baseUrl = requireNextAuthUrl();

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: { tenantId, plan: plan.data },
    });

    logAuditEvent({
      action: 'subscription.create',
      outcome: 'SUCCESS',
      requestId,
      actorId,
      actorRole,
      tenantId,
      targetType: 'subscription_checkout_session',
      targetId: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logAuditEvent({
      action: 'subscription.create',
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
