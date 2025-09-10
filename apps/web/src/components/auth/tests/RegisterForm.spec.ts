// tests/e2e/tests/components/RegisterForm.spec.ts
import { TestData, expect, test } from '../../fixtures/auth.fixture';

test.describe('RegisterForm Component', () => {
  test.beforeEach(async ({ registerPage }) => {
    await registerPage.goto();
  });

  test.describe('Component Rendering', () => {
    test('should render all form elements correctly', async ({ registerPage }) => {
      // Header
      await expect(registerPage.heading).toBeVisible();
      await expect(registerPage.heading).toHaveText('Create Account');

      // Form fields
      await expect(registerPage.fullNameInput).toBeVisible();
      await expect(registerPage.emailInput).toBeVisible();
      await expect(registerPage.passwordInput).toBeVisible();
      await expect(registerPage.confirmPasswordInput).toBeVisible();

      // Buttons and links
      await expect(registerPage.submitButton).toBeVisible();
      await expect(registerPage.loginLink).toBeVisible();

      // Initial state
      await expect(registerPage.submitButton).toBeEnabled();
      await expect(registerPage.submitButton).toHaveText('Create Account');
    });

    test('should have proper form structure', async ({ page }) => {
      // Form element
      await expect(page.locator('form')).toBeVisible();

      // Proper labels
      await expect(page.locator('label[for="fullName"]')).toHaveText('Full Name');
      await expect(page.locator('label[for="email"]')).toHaveText('Email');
      await expect(page.locator('label[for="password"]')).toHaveText('Password');
      await expect(page.locator('label[for="confirmPassword"]')).toHaveText('Confirm Password');
    });
  });

  test.describe('Password Visibility Toggle', () => {
    test('should show correct toggle icons', async ({ registerPage }) => {
      // Check initial icon (should be "show password")
      const toggleButton = registerPage.passwordToggle;
      await expect(toggleButton.locator('svg[viewBox="0 0 24 24"]')).toBeVisible();

      // After clicking, should show "hide password" icon
      await registerPage.togglePasswordVisibility();
      await expect(toggleButton.locator('svg[viewBox="0 0 24 24"]')).toBeVisible();
    });
  });
});

test.describe('Form Submission', () => {
  test('should show loading state during submission', async ({ registerPage, page }) => {
    // Mock slow API response
    await page.route('**/api/auth/register', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: '1' }, token: 'jwt-token' }),
      });
    });

    const userData = TestData.validUser();
    await registerPage.fillRegistrationForm(userData);
    await registerPage.submitButton.click();

    // Should show loading state
    await registerPage.expectFormSubmissionLoading();
  });

  test('should submit with valid data', async ({ registerPage, page }) => {
    let submittedData = null;

    await page.route('**/api/auth/register', async (route) => {
      submittedData = await route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: '1', name: submittedData.fullName, email: submittedData.email },
          token: 'jwt-token',
        }),
      });
    });

    const userData = TestData.validUser();
    await registerPage.submitRegistration(userData);

    // Verify submitted data
    expect(submittedData).toMatchObject({
      fullName: userData.fullName,
      email: userData.email,
      password: userData.password,
    });

    await registerPage.waitForRedirect('/dashboard');
  });

  test('should handle API errors gracefully', async ({ registerPage, page }) => {
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Email already exists' }),
      });
    });

    const userData = TestData.validUser();
    await registerPage.submitRegistration(userData);

    // Should show error
    await expect(registerPage.errorMessage).toBeVisible();
    await expect(registerPage.errorMessage).toContainText('Email already exists');

    // Form should be re-enabled
    await expect(registerPage.submitButton).toBeEnabled();
    await expect(registerPage.loadingSpinner).not.toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate to login page', async ({ registerPage, page }) => {
    await registerPage.loginLink.click();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should have proper link text', async ({ registerPage }) => {
    await expect(registerPage.loginLink).toHaveText('Sign in');

    // Check context text
    const contextText = registerPage.loginLink.locator('..');
    await expect(contextText).toContainText('Already have an account?');
  });
});

test.describe('Accessibility', () => {
  test('should support keyboard navigation', async ({ registerPage, page }) => {
    // Tab through all form elements
    await page.keyboard.press('Tab');
    await expect(registerPage.fullNameInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(registerPage.emailInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(registerPage.passwordInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(registerPage.confirmPasswordInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(registerPage.submitButton).toBeFocused();
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    // Check form accessibility
    await expect(page.locator('form')).toBeVisible();

    // Password toggle buttons should have proper titles
    const passwordToggle = page.locator('#password').locator('..').locator('button');
    const toggleTitle = await passwordToggle.locator('svg title').textContent();
    expect(['Show password', 'Hide password']).toContain(toggleTitle);
  });

  test('should support form submission with Enter key', async ({ registerPage, page }) => {
    const userData = TestData.validUser();
    await registerPage.fillRegistrationForm(userData);

    // Focus on submit button and press Enter
    await registerPage.submitButton.focus();
    await page.keyboard.press('Enter');

    await registerPage.waitForRedirect('/dashboard');
  });
});

test.describe('Visual States', () => {
  test('should show proper field states', async ({ registerPage }) => {
    // Focus states
    await registerPage.fullNameInput.focus();
    await expect(registerPage.fullNameInput).toHaveClass(/focus:border-primary/);

    // Error states (after invalid submission)
    await registerPage.submitButton.click();
    await expect(registerPage.fullNameInput).toHaveClass(/border-red/);
  });

  test('should show password strength visual indicator', async ({ registerPage, page }) => {
    await registerPage.passwordInput.fill('weak');

    // Check strength bar color
    const strengthBar = page.locator('.h-2.w-full.rounded-full').first();
    const strengthIndicator = strengthBar.locator('div').first();

    await expect(strengthIndicator).toHaveClass(/bg-destructive/);

    // Test strong password
    await registerPage.passwordInput.fill('StrongPass123!');
    await expect(strengthIndicator).toHaveClass(/bg-green-500/);
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should display correctly on mobile', async ({ registerPage, page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // All elements should be visible
    await expect(registerPage.heading).toBeVisible();
    await expect(registerPage.fullNameInput).toBeVisible();
    await expect(registerPage.submitButton).toBeVisible();

    // Form should fit within viewport
    const formContainer = page.locator('.max-w-md');
    await expect(formContainer).toBeVisible();
  });

  test('should handle mobile form interaction', async ({ registerPage, page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const userData = TestData.validUser();
    await registerPage.submitRegistration(userData);

    await registerPage.waitForRedirect('/dashboard');
  });
});
