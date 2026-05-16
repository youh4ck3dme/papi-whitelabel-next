import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { errorResponse, unknownErrorResponse } from '@/lib/security/http';

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return errorResponse(503, 'CONFIG_ERROR', 'STRIPE_WEBHOOK_SECRET is not configured');
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return errorResponse(400, 'INVALID_REQUEST', 'Missing stripe-signature header');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch {
      return errorResponse(400, 'INVALID_REQUEST', 'Invalid Stripe webhook signature');
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
        console.log(`Unhandled event type ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    return unknownErrorResponse(error);
  }
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
  await prisma.subscription.delete({
    where: { stripeId: subscription.id },
  });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const paymentId = paymentIntent.metadata.paymentId;
  const bookingId = paymentIntent.metadata.bookingId;

  if (paymentId) {
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        transactionId: paymentIntent.id,
      },
    });
  }

  if (bookingId) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
    });
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const paymentId = paymentIntent.metadata.paymentId;
  if (paymentId) {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'FAILED' },
    });
  }
}
