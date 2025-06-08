// src/services/auth.service.ts
import { supabase } from '../config/supabase';
import type { AuthResponse, LoginInput, PublicProfile, RegisterInput } from '../types/auth.types';

export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
  const { email, password, name, avatar_url, phone, address, preferences, social_links } = input;

  // Step 1: Register user with Supabase Auth
  const { data: supabaseAuthData, error } = await supabase.auth.signUp({ email, password });

  if (error || !supabaseAuthData?.user) {
    console.error('Error registering user:', error);
    throw new Error('Error registering user');
  }

  const userId = supabaseAuthData.user.id;
  const session = supabaseAuthData.session;

  // Step 2: Insert user profile into 'profiles' table
  const { error: profileError } = await supabase.from('profiles').upsert(
    [
      {
        user_id: userId,
        name,
        avatar_url,
        phone,
        address,
        preferences,
        social_links,
        verification_status: 'unverified',
        last_active: new Date().toISOString(),
      },
    ],
    { onConflict: 'user_id' }
  );

  if (profileError) {
    console.error('Error creating user profile:', profileError);
    throw new Error('Error creating user profile');
  }

  // Step 3: Return your own AuthResponse
  return {
    token: session?.access_token ?? '',
    user: {
      id: userId,
      email,
      profile: {
        name,
        avatar_url,
        phone,
        address,
        preferences,
        social_links,
        verification_status: 'unverified',
        last_active: new Date().toISOString(),
      },
    },
  };
};

export const loginUser = async (input: LoginInput) => {
  const { email, password } = input;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (
      error.message.includes('Invalid login credentials') ||
      error.message.includes('Invalid email or password')
    ) {
      throw new Error('Credenciales inválidas');
    }
    throw new Error(error.message);
  }

  return { user: data.user, session: data.session };
};
