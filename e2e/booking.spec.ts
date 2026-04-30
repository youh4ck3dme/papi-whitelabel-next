import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('should display the booking page', async ({ page }) => {
    await page.goto('/');
    // Skontroluj, či sa načíta hlavná stránka (v tvojom prípade s brand menom)
    await expect(page).toHaveTitle(/Booking/);
  });
});
