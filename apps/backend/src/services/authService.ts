import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabase } from './supabase';

// Define Zod schema for registration
const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .refine(
      (password) => {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[#?!@$%^&*-]/.test(password);
        return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
      },
      {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      }
    ),
  name: z.string().min(1),
});

// Define Zod schema for login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type RegisterUserInput = z.infer<typeof registerSchema>;
type LoginUserInput = z.infer<typeof loginSchema>;

export const registerUser = async (data: RegisterUserInput) => {
  // Validate input
  const parsedData = registerSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error('validation failed');
  }

  const { email, password, name } = parsedData.data;

  // Check if user already exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error('Error checking existing user');
  }

  if (existingUser) {
    throw new Error('El email ya está registrado');
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert the new user
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert([{ email, password: hashedPassword, name }])
    .select()
    .single();

  if (insertError) {
    throw new Error('Error creating user');
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: newUser.id, email },
    process.env.JWT_SECRET || 'your-secret',
    { expiresIn: '1h' }
  );

  // Remove password from response
  const { password: _removedPassword, ...userWithoutPassword } = newUser;

  return { token, user: userWithoutPassword };
};

export const loginUser = async (data: LoginUserInput) => {
  // Validate input
  const parsedData = loginSchema.safeParse(data);
  if (!parsedData.success) {
    throw new Error('validation failed');
  }

  const { email, password } = parsedData.data;

  // Fetch user
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw new Error('Usuario no encontrado');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Contraseña incorrecta');
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email },
    process.env.JWT_SECRET || 'your-secret',
    { expiresIn: '1h' }
  );

  // Remove password from response
  const { password: _removedPassword, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword };
};
