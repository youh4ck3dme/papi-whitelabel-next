import { test, expect } from '@playwright/test';

test.describe('Cron Reminders', () => {
  test('Cron endpoint rejects unauthenticated requests', async ({ request }) => {
    const response = await request.get('/api/cron');
    expect([401, 503]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(typeof body.error.code).toBe('string');
  });

  test('Cron endpoint handles authorized call with config-aware response', async ({ request }) => {
    const response = await request.get('/api/cron', {
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET || ''}` }
    });
    expect([200, 401, 503]).toContain(response.status());
    const body = await response.json();
    if (response.status() === 200) {
      expect(body).toHaveProperty('processed');
      return;
    }
    expect(body.error).toBeDefined();
  });

  test('Cron endpoint keeps stable error envelope on unauthorized path', async ({ request }) => {
    const response = await request.get('/api/cron');
    expect([401, 503]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(typeof body.error.message).toBe('string');
  });
});
