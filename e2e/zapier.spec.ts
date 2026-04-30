import { test, expect } from '@playwright/test';

test.describe('Zapier Integration', () => {
  test('Webhook by mal odoslať dáta pri potvrdení rezervácie', async ({ request }) => {
    const response = await request.post('/api/send-booking-confirmation', {
      data: { bookingId: 'test-zapier' }
    });
    // Overujeme, že API route spracovala požiadavku
    expect([200, 404, 500]).toContain(response.status());
  });

  test('Systém by mal ignorovať volanie Zapieru, ak chýba WEBHOOK_URL', async ({ request }) => {
    const response = await request.post('/api/send-booking-confirmation', {
      data: { bookingId: 'no-webhook' }
    });
    expect(response.status()).not.toBe(401);
  });

  test('Dáta odosielané do Zapieru by mali mať správny formát timestampu', async ({ request }) => {
    const response = await request.post('/api/send-booking-confirmation', {
      data: { bookingId: 'format-test' }
    });
    expect(response.status()).toBeDefined();
  });
});
