import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';
import { errorResponse, unknownErrorResponse } from '@/lib/security/http';
import { withRequestTimeout } from '@/lib/security/timeout';
import { claimWebhookEventId } from '@/lib/security/webhook-idempotency';
import { requireStripeWebhookSecret } from '@/lib/security/config';
import { getRequestId } from '@/lib/security/request-context';
import { logAuditEvent } from '@/lib/security/audit-log';
import { logSafe } from '@/lib/security/logging';

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    return await withRequestTimeout(15_000, async () => {
    const webhookSecret = requireStripeWebhookSecret();

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      logAuditEvent({
        action: 'stripe.webhook.process',
        outcome: 'DENY',
        requestId,
        actorId: 'system:webhook',
        reason: 'missing_signature',
      });
      return errorResponse(400, 'INVALID_REQUEST', 'Missing stripe-signature header');
    }

    let event: Stripe.Event;

    try {
      const stripe = getStripeClient();
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch {
      logAuditEvent({
        action: 'stripe.webhook.process',
        outcome: 'DENY',
        requestId,
        actorId: 'system:webhook',
        reason: 'invalid_signature',
      });
      return errorResponse(400, 'INVALID_REQUEST', 'Invalid Stripe webhook signature');
    }

    const tenantIdFromMetadata = getTenantIdFromEvent(event);

    const claim = claimWebhookEventId(event.id);
    if (!claim.firstSeen) {
      logAuditEvent({
        action: 'stripe.webhook.process',
        outcome: 'SUCCESS',
        requestId,
        actorId: 'system:webhook',
        tenantId: tenantIdFromMetadata,
        targetType: 'stripe_event',
        targetId: event.id,
        reason: 'duplicate_ignored',
      });
      return Response.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        logSafe('info', 'Unhandled Stripe webhook event type', {
          requestId,
          eventType: event.type,
          eventId: event.id,
        });
    }

    logAuditEvent({
      action: 'stripe.webhook.process',
      outcome: 'SUCCESS',
      requestId,
      actorId: 'system:webhook',
      tenantId: tenantIdFromMetadata,
      targetType: 'stripe_event',
      targetId: event.id,
    });

    return Response.json({ received: true });
    });
  } catch (error) {
    logAuditEvent({
      action: 'stripe.webhook.process',
      outcome: 'ERROR',
      requestId,
      actorId: 'system:webhook',
      reason: 'unhandled_exception',
    });
    return unknownErrorResponse(error);
  }
}

function getTenantIdFromEvent(event: Stripe.Event) {
  const objectWithMetadata = event.data.object as { metadata?: Record<string, string> };
  return objectWithMetadata?.metadata?.tenantId;
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const firstItem = subscription.items.data[0];
  const periodEndUnix = firstItem?.current_period_end ?? (subscription.created + 30 * 24 * 60 * 60);
  return new Date(periodEndUnix * 1000);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenantId;
  if (!tenantId) return;

  const currentPeriodEnd = getSubscriptionPeriodEnd(subscription);

  await prisma.subscription.upsert({
    where: { stripeId: subscription.id },
    create: {
      stripeId: subscription.id,
      tenantId,
      plan: 'STARTER',
      status: 'ACTIVE',
      currentPeriodEnd,
    },
    update: {
      status: 'ACTIVE',
      currentPeriodEnd,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.deleteMany({
    where: { stripeId: subscription.id },
  });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const paymentId = paymentIntent.metadata.paymentId;
  const bookingId = paymentIntent.metadata.bookingId;

  if (paymentId) {
    await prisma.payment.updateMany({
      where: {
        id: paymentId,
        NOT: { status: 'COMPLETED' },
      },
      data: {
        status: 'COMPLETED',
        transactionId: paymentIntent.id,
      },
    });
  }

  if (bookingId) {
    await prisma.booking.updateMany({
      where: {
        id: bookingId,
        NOT: { status: 'CONFIRMED' },
      },
      data: { status: 'CONFIRMED' },
    });
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const paymentId = paymentIntent.metadata.paymentId;
  if (paymentId) {
    await prisma.payment.updateMany({
      where: {
        id: paymentId,
        NOT: { status: 'COMPLETED' },
      },
      data: { status: 'FAILED' },
    });
  }
}
