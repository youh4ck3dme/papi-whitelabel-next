import { expect, test } from '@playwright/test';

async function expectErrorEnvelope(response: { status(): number; json(): Promise<unknown> }) {
  const body = await response.json() as {
    error?: { code?: unknown; message?: unknown };
  };

  expect(body.error).toBeDefined();
  expect(typeof body.error?.code).toBe('string');
  expect(typeof body.error?.message).toBe('string');
}

test.describe('API Error Contract', () => {
  test('mutating endpoints return UNAUTHORIZED with stable envelope when auth missing', async ({ request }) => {
    const endpoints = [
      '/api/bookings',
      '/api/bookings/reschedule',
      '/api/bookings/status',
      '/api/create-payment',
      '/api/create-subscription',
      '/api/payments/status',
      '/api/send-booking-confirmation',
      '/api/ai/booking-assistant',
    ];

    for (const endpoint of endpoints) {
      const response = await request.post(endpoint, { data: {} });
      expect(response.status(), endpoint).toBe(401);
      await expectErrorEnvelope(response);
    }
  });

  test('cron route returns protected contract (401 or config 503)', async ({ request }) => {
    const response = await request.get('/api/cron');
    expect([401, 503]).toContain(response.status());
    await expectErrorEnvelope(response);
  });

  test('stripe webhook invalid signature returns stable invalid-request contract', async ({ request }) => {
    const response = await request.post('/api/stripe/webhook', {
      data: { invalid: true },
      headers: { 'content-type': 'application/json' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json() as { error: { code: string; message: string } };
    expect(body.error.code).toBe('INVALID_REQUEST');
    expect(typeof body.error.message).toBe('string');
  });
});
