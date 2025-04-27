import request from 'supertest';
import { app } from '../src/index'; // Adjust path to your app entry point
import { supabase } from '../src/services/supabase';

// Mock Supabase client
jest.mock('../src/services/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      admin: {
        deleteUser: jest.fn(),
      },
    },
  },
}));

describe('Auth Register Endpoint', () => {
  // Clear mocks before each test to ensure isolation
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Clean up test users (if using real Supabase for integration tests)
  afterAll(async () => {
    await supabase.auth.admin.deleteUser('test-id'); // Adjust ID as needed
  });

  // Helper to generate unique test emails
  function generateTestEmail() {
    return `test-${Date.now()}-${Math.random().toString(36).substring(2)}@example.com`;
  }

  it('should register a user with valid data', async () => {
    // Mock successful registration
    (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'test-id', email: generateTestEmail() } },
      error: null,
    });

    const response = await request(app)
      .post('/auth/register') // Your API endpoint
      .send({
        email: generateTestEmail(),
        password: 'Password123!',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('user');
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: expect.any(String),
      password: expect.any(String),
    });
  });

  it('should reject invalid email', async () => {
    // Mock error response for invalid email
    (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid email format' },
    });

    const response = await request(app).post('/auth/register').send({
      email: 'invalid-email',
      password: 'Password123!',
    });

    expect(response.status).toBe(400); // Adjust status code based on your API
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('invalid email');
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'invalid-email',
      password: expect.any(String),
    });
  });
});
