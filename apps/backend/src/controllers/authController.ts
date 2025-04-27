import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../services/supabase';

// Define Zod schema to validate request body
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

// Register controller function
export const register = async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const parsedData = registerSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const { email, password, name } = parsedData.data;

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(fetchError);
      return res.status(500).json({ error: 'Error checking existing user' });
    }

    if (existingUser) {
      return res
        .status(409)
        .json({ error: 'User with this email already exists' });
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
      console.error(insertError);
      return res.status(500).json({ error: 'Error creating user' });
    }

    // Remove password before sending response
    const { password: _removedPassword, ...userWithoutPassword } = newUser;

    return res.status(201).json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};
