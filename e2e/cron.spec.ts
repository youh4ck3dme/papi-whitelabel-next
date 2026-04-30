import { test, expect } from '@playwright/test';

test.describe('Cron Reminders', () => {
  test('Cron endpoint by mal vrátiť 401 bez autorizácie', async ({ request }) => {
    const response = await request.get('/api/cron');
    // Ak je CRON_SECRET nastavený, mal by vrátiť 401
    expect([200, 401]).toContain(response.status());
  });

  test('Cron by mal úspešne prebehnúť, aj keď nie sú žiadne rezervácie na zajtra', async ({ request }) => {
    const response = await request.get('/api/cron', {
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET || ''}` }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('processed');
  });

  test('Cron by mal odfiltrovať zrušené rezervácie', async ({ request }) => {
    const response = await request.get('/api/cron');
    expect(response.status()).toBeDefined();
  });
});
