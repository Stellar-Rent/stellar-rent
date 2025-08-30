import { expect, test } from '@playwright/test';

test.describe('Authentication and Session Management', () => {
  // Test 1: Anonymous users are redirected from protected routes with return URL
  test('anonymous user is redirected from host dashboard to login', async ({ page }) => {
    await page.goto('/host/dashboard');
    // Expect redirection to the login page with a `redirect_to` query parameter
    await expect(page).toHaveURL(/.*\/login\?redirect_to=%2Fhost%2Fdashboard/);
    await expect(page.getByRole('heading', { name: 'Log in to your account' })).toBeVisible();
  });

  // Test 2: Successful registration and session creation
  test('successfully registers a new user', async ({ page }) => {
    // Navigate to the registration page
    await page.goto('/register');
    // Fill out the registration form with valid data
    await page.getByTestId('email-input').fill('newtenant@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByRole('button', { name: 'Register' }).click();

    // The backend redirects on successful registration,
    // so we assert the URL and a protected element
    await expect(page).toHaveURL(/.*\/tenant\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Tenant Dashboard' })).toBeVisible();
  });

  // Test 3: Failed registration (user already exists)
  test('shows an error when registering a user with an existing email', async ({ page }) => {
    await page.goto('/register');
    // Use an email that is known to exist (e.g., from your global setup)
    await page.getByTestId('email-input').fill('host@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByRole('button', { name: 'Register' }).click();

    // Expect the backend to return a 409 Conflict and the UI to show the error
    const errorMessage = await page.getByText(/El usuario ya ha sido registrado/i);
    await expect(errorMessage).toBeVisible();
  });

  // Test 4: Failed login (invalid credentials)
  test('shows an error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    // Fill with a valid email but an invalid password
    await page.getByTestId('email-input').fill('tenant@example.com');
    await page.getByTestId('password-input').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    // Expect the backend to return a 401 Unauthorized and the UI to show the error
    const errorMessage = await page.getByText('Credenciales inválidas');
    await expect(errorMessage).toBeVisible();
  });

  // Test 5: Login with incomplete data (Zod validation error)
  test('shows validation error for incomplete login data', async ({ page }) => {
    await page.goto('/login');
    // Leave the password field empty
    await page.getByTestId('email-input').fill('tenant@example.com');
    await page.getByRole('button', { name: 'Login' }).click();

    // Expect a 400 Bad Request from the validator and the UI to show the error
    const errorMessage = await page.getByText('Datos de inicio de sesión inválidos');
    await expect(errorMessage).toBeVisible();
  });
});
