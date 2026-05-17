import { expect, test } from '@playwright/test';

test.describe('Optional Integration Resilience', () => {
  test('send-booking-confirmation fails deterministically without DB config and never as raw 500 leak', async ({ request }) => {
    const response = await request.post('/api/send-booking-confirmation', {
      data: { bookingId: 'missing-booking-id' },
      headers: {
        authorization: 'Bearer dev:tenant-a:admin:dev-admin',
        'x-forwarded-for': '203.0.113.20',
      },
    });

    expect([503, 404, 403]).toContain(response.status());

    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(typeof body.error.code).toBe('string');
  });
});
