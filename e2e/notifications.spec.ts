import { test, expect } from '@playwright/test';

test.describe('SMS & Email Notifications', () => {
  const authHeaders = {
    authorization: 'Bearer dev:tenant-a:staff:dev-staff',
    'x-forwarded-for': '203.0.113.41',
  };

  test('Send-booking-confirmation route enforces authentication', async ({ request }) => {
    const response = await request.post('/api/send-booking-confirmation', {
      data: { bookingId: 'test-booking-id' },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('Notification path returns config-aware status for missing booking', async ({ request }) => {
    const response = await request.post('/api/send-booking-confirmation', {
      data: { bookingId: 'non-existent' },
      headers: authHeaders,
    });

    expect([404, 503]).toContain(response.status());
    const body = await response.json();
    if (response.status() === 404) {
      expect(body.error.code).toBe('NOT_FOUND');
      return;
    }
    expect(body.error.code).toBe('CONFIG_ERROR');
  });

  test('Notification route keeps stable validation response', async ({ request }) => {
    const response = await request.post('/api/send-booking-confirmation', {
      data: {},
      headers: authHeaders,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe('INVALID_REQUEST');
  });
});
