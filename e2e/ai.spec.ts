import { test, expect } from '@playwright/test';

test.describe('AI Booking Assistant', () => {
  const authHeaders = {
    authorization: 'Bearer dev:tenant-a:staff:dev-staff',
    'x-forwarded-for': '203.0.113.40',
  };

  test('AI endpoint enforces auth for booking assistant', async ({ request }) => {
    const response = await request.post('/api/ai/booking-assistant', {
      data: {
        tenantId: 'test-tenant',
        query: 'Kedy máte voľno?',
        date: '2026-05-01',
      }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('AI returns config/db aware error for unknown tenant lookup', async ({ request }) => {
    const response = await request.post('/api/ai/booking-assistant', {
      data: {
        tenantId: 'invalid-id',
        query: 'Hello',
        date: '2026-05-01',
      },
      headers: authHeaders,
    });

    expect([403, 404, 503]).toContain(response.status());
    const body = await response.json();
    if (response.status() === 403) {
      expect(body.error.code).toBe('FORBIDDEN');
      return;
    }
    if (response.status() === 404) {
      expect(body.error.code).toBe('NOT_FOUND');
      return;
    }
    expect(body.error.code).toBe('CONFIG_ERROR');
  });

  test('AI validates payload shape with stable error response', async ({ request }) => {
    const response = await request.post('/api/ai/booking-assistant', {
      data: {
        query: '',
        date: 'invalid-date',
      },
      headers: authHeaders,
    });

    expect([400, 503]).toContain(response.status());
    const body = await response.json();
    if (response.status() === 400) {
      expect(body.error.code).toBe('INVALID_REQUEST');
      return;
    }
    expect(body.error.code).toBe('CONFIG_ERROR');
  });
});
