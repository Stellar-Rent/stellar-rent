import type { User as user } from '@supabase/supabase-js';
import type { Request } from 'express';
import { z } from 'zod';

export interface AuthRequest extends Request {
  user?: user;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema> &
  Omit<PublicProfile, 'verification_status' | 'last_active'>;

export interface PublicProfile {
  name: string;
  avatar_url?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    country: string;
    postal_code: string;
  };
  preferences?: {
    notifications: boolean;
    newsletter: boolean;
    language: string;
  };
  social_links?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  verification_status: 'unverified' | 'pending' | 'verified';
  last_active: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: PublicProfile;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
