// playwright/global-setup.ts
import { expect, request } from '@playwright/test';

async function globalSetup() {
  const reqContext = await request.newContext();

  // Create a host user for testing
  await reqContext.post('http://localhost:3000/api/v1/auth/register', {
    data: {
      email: 'host@example.com',
      password: 'testpassword',
      // Include any other required fields for host registration
      role: 'host',
    },
  });

  // Create a tenant user for testing
  await reqContext.post('http://localhost:3000/api/v1/auth/register', {
    data: {
      email: 'tenant@example.com',
      password: 'testpassword',
      // Include any other required fields for tenant registration
      role: 'tenant',
    },
  });

  await reqContext.dispose();
}
export default globalSetup;
