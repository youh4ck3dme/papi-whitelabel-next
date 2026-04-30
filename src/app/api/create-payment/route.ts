import { stripe } from '@/lib/stripe';
import { nowPayments } from '@/lib/nowpayments';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { tenantId, bookingId, amount, currency, method } = await request.json();

    const payment = await prisma.payment.create({
      data: {
        tenantId,
        bookingId,
        amount,
        currency,
        method: method,
        status: 'PENDING',
      },
    });

    if (method === 'CARD') {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        customer: tenant?.stripeCustomerId || undefined,
        metadata: {
          tenantId,
          bookingId,
          paymentId: payment.id,
        },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id,
      });
    } else if (method === 'CRYPTO') {
      const nowPaymentsResponse = await nowPayments.createPayment(
        amount,
        currency,
        payment.id,
        tenantId
      );

      return NextResponse.json({
        paymentUrl: nowPaymentsResponse.url,
        paymentId: payment.id,
      });
    } else {
      return NextResponse.json({ error: 'Unsupported payment method' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
