import { expect, test } from '@playwright/test';

test.describe('API Security Guards', () => {
  test('returns 401 for mutating endpoints without auth', async ({ request }) => {
    const endpoints = [
      {
        path: '/api/create-payment',
        data: {
          tenantId: 'tenant-a',
          bookingId: 'booking-1',
          amount: 10,
          currency: 'USD',
          method: 'CARD',
        },
      },
      {
        path: '/api/create-subscription',
        data: {
          tenantId: 'tenant-a',
          plan: 'STARTER',
          email: 'owner@example.com',
        },
      },
      {
        path: '/api/send-booking-confirmation',
        data: {
          bookingId: 'booking-1',
        },
      },
      {
        path: '/api/ai/booking-assistant',
        data: {
          tenantId: 'tenant-a',
          query: 'Any free slots?',
          date: new Date().toISOString(),
        },
      },
    ];

    for (const endpoint of endpoints) {
      const response = await request.post(endpoint.path, {
        data: endpoint.data,
        headers: {
          'x-forwarded-for': '203.0.113.10',
        },
      });

      expect(response.status(), endpoint.path).toBe(401);
      const body = await response.json();
      expect(body.error.code, endpoint.path).toBe('UNAUTHORIZED');
    }
  });

  test('returns 400 with stable error shape for invalid payload', async ({ request }) => {
    const response = await request.post('/api/create-payment', {
      data: {
        bookingId: 'booking-1',
        currency: 'USD',
        method: 'CARD',
      },
      headers: {
        authorization: 'Bearer dev:tenant-a:admin:dev-admin',
        'x-forwarded-for': '203.0.113.11',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe('INVALID_REQUEST');
    expect(typeof body.error.message).toBe('string');
  });

  test('returns 403 when tenant context mismatches token tenant', async ({ request }) => {
    const response = await request.post('/api/create-subscription', {
      data: {
        tenantId: 'tenant-b',
        plan: 'STARTER',
        email: 'owner@example.com',
      },
      headers: {
        authorization: 'Bearer dev:tenant-a:owner:dev-owner',
        'x-forwarded-for': '203.0.113.12',
      },
    });

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  test('returns 429 when billing endpoint exceeds rate limit', async ({ request }) => {
    const headers = {
      authorization: 'Bearer dev:tenant-rate:admin:dev-admin',
      'x-forwarded-for': '203.0.113.13',
    };

    let got429 = false;

    for (let i = 0; i < 40; i += 1) {
      const response = await request.post('/api/create-subscription', {
        data: {
          plan: 'STARTER',
          email: 'invalid-email',
        },
        headers,
      });

      if (response.status() === 429) {
        const body = await response.json();
        expect(body.error.code).toBe('RATE_LIMITED');
        got429 = true;
        break;
      }

      expect(response.status()).toBe(400);
    }

    expect(got429).toBeTruthy();
  });

  test('returns 400 on webhook request with missing signature header', async ({ request }) => {
    const response = await request.post('/api/stripe/webhook', {
      data: { test: true },
      headers: {
        'content-type': 'application/json',
      },
    });

    expect([400, 503]).toContain(response.status());

    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(typeof body.error.code).toBe('string');
  });
});
