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

export const registerSchema = loginSchema.extend({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre es demasiado largo'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export interface AuthResponse {
  token: string;
  user: User;
}
