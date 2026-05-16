import { test, expect } from '@playwright/test';

test.describe('Zapier Integration', () => {
  const authHeaders = {
    authorization: 'Bearer dev:tenant-a:staff:dev-staff',
    'x-forwarded-for': '203.0.113.42',
  };

  test('Zapier path is protected by auth before business logic', async ({ request }) => {
    const response = await request.post('/api/send-booking-confirmation', {
      data: { bookingId: 'test-zapier' },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('Zapier optional integration does not change safe API envelope', async ({ request }) => {
    const response = await request.post('/api/send-booking-confirmation', {
      data: { bookingId: 'no-webhook' },
      headers: authHeaders,
    });
    expect([404, 503]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Zapier path preserves invalid payload contract', async ({ request }) => {
    const response = await request.post('/api/send-booking-confirmation', {
      data: { bookingId: '' },
      headers: authHeaders,
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe('INVALID_REQUEST');
  });
});
