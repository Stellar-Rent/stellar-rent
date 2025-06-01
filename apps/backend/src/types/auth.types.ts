import type { Request } from 'express';
import { z } from 'zod';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
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

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
  avatar_url: z.string().url().optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    country: z.string(),
    postal_code: z.string(),
  }).optional(),
  preferences: z.object({
    notifications: z.boolean(),
    newsletter: z.boolean(),
    language: z.string(),
  }).optional(),
  social_links: z.object({
    facebook: z.string().url().optional(),
    twitter: z.string().url().optional(),
    instagram: z.string().url().optional(),
  }).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

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
