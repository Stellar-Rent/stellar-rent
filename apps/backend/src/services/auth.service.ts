import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
} from '../types/auth.types';

export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', input.email)
    .single();

  if (userError || !user) {
    throw new Error('Usuario no encontrado');
  }

  const isPasswordValid = await bcrypt.compare(
    input.password,
    user.password_hash
  );
  if (!isPasswordValid) {
    throw new Error('Contraseña incorrecta');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
    }
  );

  const userResponse: User = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  return { token, user: userResponse };
};

export const registerUser = async (
  input: RegisterInput
): Promise<AuthResponse> => {
  const { data: existingUser } = await supabase
    .from('users')
    .select('email')
    .eq('email', input.email)
    .single();

  if (existingUser) {
    throw new Error('El email ya está registrado');
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const { data: user, error: insertError } = await supabase
    .from('users')
    .insert([
      {
        email: input.email,
        password_hash: hashedPassword,
        name: input.name,
      },
    ])
    .select()
    .single();

  if (insertError || !user) {
    throw new Error('Error al crear usuario');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
    }
  );

  const userResponse: User = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  return { token, user: userResponse };
};
