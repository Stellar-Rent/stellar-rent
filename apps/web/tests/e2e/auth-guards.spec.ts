import { expect, test } from '@playwright/test';

// Define the pages we'll be testing
const PROTECTED_ROUTE = '/host/dashboard';
const PUBLIC_ROUTE = '/login';

// Mock user data for different roles and auth types
const hostEmailUser = {
  id: 'host-123',
  name: 'Host Email User',
  email: 'host@example.com',
  authType: 'email',
};

const tenantWalletUser = {
  id: 'tenant-456',
  name: 'Tenant Wallet User',
  publicKey: 'GBY...',
  authType: 'wallet',
};

test.describe('Authentication Guards and Redirections', () => {
  // Test 1: Anonymous users are redirected from protected routes
  test('should redirect an unauthenticated user to the login page', async ({ page }) => {
    // Navigate to a protected route without setting up any authentication
    await page.goto(PROTECTED_ROUTE);

    // Expect the URL to be the login page
    await expect(page).toHaveURL(new RegExp(PUBLIC_ROUTE));
  });

  // Test 2: Users with a valid session can access protected routes
  test('should allow an authenticated host to access the dashboard', async ({ page }) => {
    // Set up a valid host session in local storage
    await page.goto('/');
    await page.evaluate(
      ({ user }) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authType', user.authType);
      },
      { user: hostEmailUser }
    );

    // Navigate directly to the protected route
    await page.goto(PROTECTED_ROUTE);

    // The presence of a key element on the dashboard confirms successful access
    await expect(page.locator('h1:has-text("Host Dashboard")')).toBeVisible();
  });

  // Test 3: Users with a session but an invalid authType are redirected
  test('should redirect a user with an invalid auth type for the route', async ({ page }) => {
    // Set up a session for a tenant user
    await page.goto('/');
    await page.evaluate(
      ({ user }) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authType', user.authType);
      },
      { user: tenantWalletUser }
    );

    // Navigate to a route that only allows email-based auth (for example)
    // The test assumes a route like /profile-email exists, which only allows 'email' auth.
    // Replace this with your actual route that checks 'allowedAuthTypes'.
    await page.goto(PROTECTED_ROUTE);

    // Expect redirection to the login page
    await expect(page).toHaveURL(new RegExp(PUBLIC_ROUTE));
  });

  // Test 4: Session persists after a page reload
  test('should persist the session after page reload', async ({ page }) => {
    // Set up a valid host session
    await page.goto('/');
    await page.evaluate(
      ({ user }) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authType', user.authType);
      },
      { user: hostEmailUser }
    );

    // Navigate to the protected route
    await page.goto(PROTECTED_ROUTE);

    // Reload the page
    await page.reload();

    // The host dashboard should still be visible without redirection
    await expect(page.locator('h1:has-text("Host Dashboard")')).toBeVisible();
  });

  // Test 5: Logout clears the session from local storage
  test('should clear local storage and redirect on logout', async ({ page }) => {
    // Set up a valid host session
    await page.goto('/');
    await page.evaluate(
      ({ user }) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authType', user.authType);
      },
      { user: hostEmailUser }
    );

    // Navigate to the dashboard
    await page.goto(PROTECTED_ROUTE);
    await expect(page.locator('h1:has-text("Host Dashboard")')).toBeVisible();

    // Find and click the logout button (you need to make sure this selector is correct)
    await page.locator('[data-testid="logout-button"]').click();

    // Expect the page to be redirected to the public route
    await expect(page).toHaveURL(new RegExp(PUBLIC_ROUTE));

    // The session data should be cleared from local storage
    const localStorageData = await page.evaluate(() => localStorage.getItem('user'));
    expect(localStorageData).toBeNull();
  });
});
