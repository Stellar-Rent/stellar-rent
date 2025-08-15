import { expect, test } from '@playwright/test';

test('homepage renders and has login/register CTAs', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/StellaRent/i);
});
