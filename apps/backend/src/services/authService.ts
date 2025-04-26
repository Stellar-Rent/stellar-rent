import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabase } from '../config/supabase';

interface User {
  id: string;
  email: string;
  name: string;
}

// Esquemas de validación
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre es demasiado largo'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginUser = async (input: LoginInput) => {
  // Validar input
  const validatedInput = loginSchema.parse(input);

  // Buscar usuario
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', validatedInput.email)
    .single();

  if (userError || !user) {
    throw new Error('Usuario no encontrado');
  }

  // Verificar contraseña
  const isPasswordValid = await bcrypt.compare(
    validatedInput.password,
    user.password
  );
  if (!isPasswordValid) {
    throw new Error('Contraseña incorrecta');
  }

  // Generar token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET ?? '',
    {
      expiresIn: '1h',
    }
  );

  // Preparar respuesta
  const userResponse = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  return { token, user: userResponse };
};

export const registerUser = async (input: RegisterInput) => {
  // Validar input
  const validatedInput = registerSchema.parse(input);

  // Verificar si el usuario ya existe
  const { data: existingUser } = await supabase
    .from('users')
    .select('email')
    .eq('email', validatedInput.email)
    .single();

  if (existingUser) {
    throw new Error('El email ya está registrado');
  }

  // Hashear contraseña
  const hashedPassword = await bcrypt.hash(validatedInput.password, 10);

  // Crear usuario
  const { data: user, error: insertError } = await supabase
    .from('users')
    .insert([
      {
        email: validatedInput.email,
        password: hashedPassword,
        name: validatedInput.name,
      },
    ])
    .select()
    .single();

  if (insertError || !user) {
    throw new Error('Error al crear usuario');
  }

  // Generar token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET ?? '',
    {
      expiresIn: '1h',
    }
  );

  return { token, user };
};
