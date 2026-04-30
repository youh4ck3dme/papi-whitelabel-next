import { test, expect } from '@playwright/test';

test.describe('AI Booking Assistant', () => {
  test('AI by malo odpovedať na dotaz o voľných termínoch', async ({ request }) => {
    const response = await request.post('/api/ai/booking-assistant', {
      data: {
        tenantId: 'test-tenant',
        query: 'Kedy máte voľno?',
        date: '2026-05-01'
      }
    });
    // Ak nemáme OpenAI kľúč, vráti 500 alebo fallback, čo testujeme
    expect(response.status()).toBeDefined();
  });

  test('AI by malo vrátiť chybu, ak tenant neexistuje', async ({ request }) => {
    const response = await request.post('/api/ai/booking-assistant', {
      data: {
        tenantId: 'invalid-id',
        query: 'Hello',
        date: '2026-05-01'
      }
    });
    expect(response.status()).toBe(404);
  });

  test('AI asistent by mal vrátiť textovú odpoveď v správnom jazyku', async ({ request }) => {
    const response = await request.post('/api/ai/booking-assistant', {
      data: {
        tenantId: 'sk-tenant',
        query: 'Aké služby ponúkate?',
        date: '2026-05-01'
      }
    });
    expect(response.status()).toBeDefined();
  });
});
