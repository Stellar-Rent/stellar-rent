import { expect, test } from '@playwright/test';

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Create Account');
    await expect(page.locator('input[id="fullName"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Name must be at least 2 characters')).toBeVisible();
    await expect(page.locator('text=Invalid email address')).toBeVisible();
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[id="email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid email address')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.fill('input[id="password"]', 'weak');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should validate password confirmation match', async ({ page }) => {
    await page.fill('input[id="fullName"]', 'John Doe');
    await page.fill('input[id="email"]', 'john@example.com');
    await page.fill('input[id="password"]', 'Password123');
    await page.fill('input[id="confirmPassword"]', 'DifferentPassword123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[id="password"]');
    const toggleButton = page.locator('button').nth(1); // First toggle button

    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show loading state during registration', async ({ page }) => {
    await page.fill('input[id="fullName"]', 'John Doe');
    await page.fill('input[id="email"]', 'john@example.com');
    await page.fill('input[id="password"]', 'Password123');
    await page.fill('input[id="confirmPassword"]', 'Password123');

    // Mock API to delay response
    await page.route('**/api/auth/register', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.click('button[type="submit"]');
    await expect(page.locator('text=Creating account...')).toBeVisible();
  });

  test('should display API error message', async ({ page }) => {
    await page.fill('input[id="fullName"]', 'John Doe');
    await page.fill('input[id="email"]', 'existing@example.com');
    await page.fill('input[id="password"]', 'Password123');
    await page.fill('input[id="confirmPassword"]', 'Password123');

    // Mock API error
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 409,
        body: JSON.stringify({ error: 'Email already registered' }),
      });
    });

    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email already registered')).toBeVisible();
  });

  test('should have link to login page', async ({ page }) => {
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toContainText('Sign in');
  });

  test('should successfully register with valid data', async ({ page }) => {
    await page.fill('input[id="fullName"]', 'John Doe');
    await page.fill('input[id="email"]', 'newuser@example.com');
    await page.fill('input[id="password"]', 'Password123');
    await page.fill('input[id="confirmPassword"]', 'Password123');

    // Mock successful API response
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        body: JSON.stringify({
          token: 'fake-jwt-token',
          user: {
            id: '123',
            email: 'newuser@example.com',
            name: 'John Doe',
          },
        }),
      });
    });

    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
  });
});
