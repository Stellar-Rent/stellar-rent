import { supabase } from '../src/services/supabase';

describe('Auth Register Endpoint', () => {
  it('should register a user with valid data', async () => {
    const response = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'Password123!',
    });
    expect(response.error).toBeNull();
    expect(response.data.user).toBeDefined();
  });

  it('should reject invalid email', async () => {
    const response = await supabase.auth.signUp({
      email: 'invalid-email',
      password: 'Password123!',
    });
    expect(response.error).not.toBeNull();
    expect(response.error?.message).toContain('invalid email');
  });
});
