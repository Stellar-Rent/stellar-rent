import { supabase } from '../config/supabase';
import type {
  AuthResponse,
  AuthUser,
  LoginInput,
  PublicProfile,
  RegisterInput,
  User,
} from '../types/auth.types';

export const loginUser = async ({ email, password }: { email: string; password: string }) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
  const { email, password, name, avatar_url, phone, address, preferences, social_links } = input;

  // Step 1: Supabase Auth registration
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) {
    console.error('Error al registrar usuario:', error);
    throw new Error('Error al registrar usuario');
  }

  const userId = data.user.id;

  // Step 2: Insert into profiles
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
    console.error('Error al crear perfil de usuario:', profileError);
    throw new Error('Error al crear perfil de usuario');
  }

  // Optional: you can create a JWT here if needed
  return {
    token: data.session?.access_token ?? '',
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

// export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
//   const { data: user, error: userError } = await supabase
//     .from('users')
//     .select(
//       `
//       id,
//       email,
//       password_hash,
//       profiles (
//         name,
//         avatar_url,
//         phone,
//         address,
//         preferences,
//         social_links,
//         verification_status,
//         last_active
//       )
//     `
//     )
//     .eq('email', input.email)
//     .single();

//   if (userError || !user) {
//     throw new Error('Usuario no encontrado');
//   }

//   const isPasswordValid = await bcrypt.compare(
//     input.password,
//     user.password_hash
//   );
//   if (!isPasswordValid) {
//     throw new Error('Contraseña incorrecta');
//   }

//   if (!process.env.JWT_SECRET) {
//     throw new Error('JWT_SECRET environment variable is required');
//   }

//   const token = jwt.sign(
//     {
//       id: user.id,
//       email: user.email,
//     },
//     process.env.JWT_SECRET,
//     {
//       expiresIn: '1h',
//     }
//   );

//   const userResponse: AuthUser = {
//     id: user.id,
//     email: user.email,
//     profile: user.profiles as PublicProfile,
//   };

//   return { token, user: userResponse };
// };

// export const registerUser = async (
//   input: RegisterInput
// ): Promise<AuthResponse> => {
//   const { data: existingUser } = await supabase
//     .from('users')
//     .select('email')
//     .eq('email', input.email)
//     .single();

//   if (existingUser) {
//     throw new Error('El email ya está registrado');
//   }

//   const hashedPassword = await bcrypt.hash(input.password, 10);

//   const { data: user, error: insertError } = await supabase
//     .from('users')
//     .insert([
//       {
//         email: input.email,
//         password_hash: hashedPassword,
//         name: input.name,
//       },
//     ])
//     .select()
//     .single();

//   if (insertError || !user) {
//     throw new Error('Error al crear usuario');
//   }

//   if (!process.env.JWT_SECRET) {
//     throw new Error('JWT_SECRET environment variable is required');
//   }

//   const token = jwt.sign(
//     {
//       id: user.id,
//       email: user.email,
//     },
//     process.env.JWT_SECRET,
//     {
//       expiresIn: '1h',
//     }
//   );

//   const userResponse: User = {
//     id: user.id,
//     email: user.email,
//     name: user.name,
//   };

//   return { token, user: userResponse };
// };
