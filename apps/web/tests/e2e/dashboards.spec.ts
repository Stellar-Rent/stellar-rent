import { expect, test } from '@playwright/test';

// Define the URLs for the dashboard and login pages
const DASHBOARD_URL = '/';
const LOGIN_URL = '/login'; // Assuming this is the login page URL

// Mock data for test users
const mockHostUser = {
  id: 'host-123',
  name: 'Host User',
  email: 'host@example.com',
  role: 'host',
};

const mockTenantUser = {
  id: 'tenant-456',
  name: 'Tenant User',
  email: 'tenant@example.com',
  role: 'tenant',
};

test.describe('Host Dashboard Access Control', () => {
  // Test 1: Validate that an anonymous user is redirected from a protected route
  test('should redirect anonymous users to the login page', async ({ page }) => {
    // Navigate to the dashboard page without any authentication
    await page.goto(DASHBOARD_URL);

    // Expect the URL to be the login page
    await expect(page).toHaveURL(new RegExp(LOGIN_URL));

    // Optional: Assert that the login page content is visible
    await expect(page.locator('h1')).toHaveText('Sign in to your account');
  });

  // Test 2: Validate that a user with a 'tenant' role cannot access host features
  test('should not allow tenant users to access the host dashboard', async ({ page }) => {
    // Intercept API calls to simulate a tenant session
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: mockTenantUser }),
      });
    });

    // Navigate to the dashboard page
    await page.goto(DASHBOARD_URL);

    // Expect the page to redirect away from the dashboard or show an access denied message.
    // Assuming a redirect to a tenant-specific page
    await expect(page).not.toHaveURL(new RegExp(DASHBOARD_URL));
    await expect(page.locator('text=Access Denied')).toBeVisible(); // Or similar
  });
});

test.describe('Host Dashboard Functionality', () => {
  // Use a beforeEach hook to ensure we are logged in as a host for all tests in this block
  test.beforeEach(async ({ page }) => {
    // Intercept API calls to simulate a successful host login
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: mockHostUser }),
      });
    });

    // Navigate to the dashboard page
    await page.goto(DASHBOARD_URL);

    // Assert that we are on the dashboard and the user's name is visible
    await expect(page).toHaveURL(DASHBOARD_URL);
    await expect(page.locator(`text=${mockHostUser.name}`)).toBeVisible();
  });

  // Test 3: Validate that the session persists after a page reload
  test('should persist the host session across page reloads', async ({ page }) => {
    // The beforeEach hook already logged us in
    // Now, force a page reload
    await page.reload();

    // The user's name should still be visible, indicating the session is active
    await expect(page.locator(`text=${mockHostUser.name}`)).toBeVisible();
  });

  // Test 4: Validate logout functionality
  test('should clear the session and redirect on logout', async ({ page }) => {
    // Find and click the logout button (assuming a data-testid or a unique class)
    // You may need to update this selector to match your component
    await page.locator('[data-testid="logout-button"]').click();

    // Wait for the redirect to the login page
    await page.waitForURL(new RegExp(LOGIN_URL));

    // Assert that the URL is the login page and the user's name is no longer visible
    await expect(page).toHaveURL(new RegExp(LOGIN_URL));
    await expect(page.locator(`text=${mockHostUser.name}`)).not.toBeVisible();
  });

  // Test 5: Validate host-only action (adding a property)
  test('should allow host to add a new property', async ({ page }) => {
    // Click the "My Properties" tab to ensure we are on the correct page
    await page.locator('button:has-text("My Properties")').click();

    // Click the "Add New Property" button to open the modal
    await page.locator('button:has-text("+ Add New Property")').click();

    // Assert the modal is visible
    await expect(page.locator('h2:has-text("Add New Property")')).toBeVisible();

    // Fill out the form
    const propertyTitle = `Test Property ${Date.now()}`;
    await page.fill('#property-title', propertyTitle);
    await page.fill('#location', 'Test City');
    await page.fill('#price', '150');
    await page.fill('#description', 'A cozy test property.');

    // Mock the API response to avoid an actual backend call
    const [response] = await Promise.all([
      page.waitForResponse('**/api/properties'),
      page.locator('button:has-text("Add Property")').click(),
    ]);

    // Assert the API call was successful
    expect(response.status()).toBe(201);

    // Assert the new property card is visible on the page
    await expect(page.locator(`h3:has-text("${propertyTitle}")`)).toBeVisible();
  });
});
