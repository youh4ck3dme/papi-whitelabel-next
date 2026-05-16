import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nowPayments } from '@/lib/nowpayments';
import { getStripeClient } from '@/lib/stripe';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { enforceTenantContext } from '@/lib/security/tenant';
import { unknownErrorResponse } from '@/lib/security/http';
import { optionalString, parseJsonBody, requireEnum, requireNumber, requireString } from '@/lib/security/validation';
import { requireAuth, requireRole } from '@/lib/security/auth';

const SUPPORTED_PAYMENT_METHODS = ['CARD', 'CRYPTO'] as const;

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const roleCheck = requireRole(auth.context, ['owner', 'admin', 'staff']);
    if (!roleCheck.ok) return roleCheck.response;

    const rateLimit = enforceRateLimit({
      request,
      bucket: 'billing:create-payment',
      identity: `${auth.context.tenantId}:${auth.context.userId}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!rateLimit.ok) return rateLimit.response;

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const tenantIdInput = optionalString(parsedBody.data.tenantId, 'tenantId');
    if (!tenantIdInput.ok) return tenantIdInput.response;

    const tenantCheck = enforceTenantContext(tenantIdInput.data, auth.context);
    if (!tenantCheck.ok) return tenantCheck.response;

    const bookingId = requireString(parsedBody.data.bookingId, 'bookingId');
    if (!bookingId.ok) return bookingId.response;

    const amount = requireNumber(parsedBody.data.amount, 'amount', { min: 0.01 });
    if (!amount.ok) return amount.response;

    const currency = requireString(parsedBody.data.currency, 'currency', {
      minLength: 3,
      maxLength: 8,
      pattern: /^[A-Za-z]+$/,
    });
    if (!currency.ok) return currency.response;

    const method = requireEnum(parsedBody.data.method, 'method', SUPPORTED_PAYMENT_METHODS);
    if (!method.ok) return method.response;

    const tenantId = tenantCheck.tenantId;

    const payment = await prisma.payment.create({
      data: {
        tenantId,
        bookingId: bookingId.data,
        amount: amount.data,
        currency: currency.data.toUpperCase(),
        method: method.data,
        status: 'PENDING',
      },
    });

    if (method.data === 'CARD') {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      const stripe = getStripeClient();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount.data * 100),
        currency: currency.data.toLowerCase(),
        customer: tenant?.stripeCustomerId || undefined,
        metadata: {
          tenantId,
          bookingId: bookingId.data,
          paymentId: payment.id,
        },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id,
      });
    }

    const nowPaymentsResponse = await nowPayments.createPayment(
      amount.data,
      currency.data.toUpperCase(),
      payment.id,
      tenantId
    );

    return NextResponse.json({
      paymentUrl: nowPaymentsResponse.url,
      paymentId: payment.id,
    });
  } catch (error) {
    return unknownErrorResponse(error);
  }
}
