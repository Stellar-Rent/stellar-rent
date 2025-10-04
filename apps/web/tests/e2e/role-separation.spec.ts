import { expect, test } from '@playwright/test';

// Define a test group that uses a pre-authenticated host session
test.describe('Host User Role Access', () => {
  // Use a pre-saved state to skip the login step for every test in this block
  // This file would be created by a `global-setup.ts` script.
  test.use({ storageState: 'playwright/.auth/host.json' });

  // Test 1: A host user can access their own protected dashboard
  test('host can access their own dashboard', async ({ page }) => {
    // The browser context is already authenticated, so a simple goto should work
    await page.goto('/host/dashboard');
    await expect(page).toHaveURL(/.*\/host\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Host Dashboard' })).toBeVisible();
  });

  // Test 2: A host user cannot access a tenant-only page
  test('host is redirected when trying to access a tenant-only page', async ({ page }) => {
    await page.goto('/tenant/bookings');
    // The host should be redirected back to their own dashboard or an error page
    await expect(page).toHaveURL(/.*\/host\/dashboard/);
    await expect(page.getByText('Access Denied')).not.toBeVisible();
  });

  // Test 3: A host cannot perform a tenant-only action (API enforcement)
  test('host cannot create a booking on a property', async ({ page }) => {
    // Navigate to a property page where a booking action is possible
    await page.goto('/property/1234');

    // Intercept the API call to ensure it is correctly blocked
    page.route('**/api/v1/bookings', async (route) => {
      // The host should not have permission, so the request should be aborted or return an error
      await route.abort('accessdenied');
    });

    // The UI should prevent the action (e.g., button is disabled) or show an error
    await page.getByRole('button', { name: 'Book Property' }).click();
    await expect(page.getByText('You do not have permission to book this property.')).toBeVisible();
  });
});

// A similar test group for the tenant role
test.describe('Tenant User Role Access', () => {
  test.use({ storageState: 'playwright/.auth/tenant.json' });

  // Test 1: A tenant user can access their own protected dashboard
  test('tenant can access their own dashboard', async ({ page }) => {
    await page.goto('/tenant/dashboard');
    await expect(page).toHaveURL(/.*\/tenant\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Tenant Dashboard' })).toBeVisible();
  });

  // Test 2: A tenant cannot access a host-only page
  test('tenant is redirected when trying to access a host-only page', async ({ page }) => {
    await page.goto('/host/dashboard');
    // The tenant should be redirected to their own dashboard
    await expect(page).toHaveURL(/.*\/tenant\/dashboard/);
  });
});
