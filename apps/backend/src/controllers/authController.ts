// src/controllers/auth.controller.ts
import type { Request, Response } from 'express';
import { loginUser, registerUser } from '../services/auth.service';

// export const register = async (req: Request, res: Response) => {
//   try {
//     const { user,} = await registerUser(req.body);
//     res.status(201).json({ user, session });
//   } catch (error) {
//     console.error('Register error:', error);
//     const message = error instanceof Error ? error.message : 'Error desconocido';
//     if (message.includes('registrado')) {
//       return res.status(409).json({ error: message });
//     }
//     res.status(400).json({ error: message });
//   }
// };

export const register = async (req: Request, res: Response) => {
  try {
    const { user, token } = await registerUser(req.body);

    res.status(201).json({
      user,
      token, // send token, not session
    });
  } catch (error) {
    console.error('Register error:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';

    if (message.includes('registrado')) {
      return res.status(409).json({ error: message });
    }

    res.status(400).json({ error: message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { user, session } = await loginUser(req.body);
    res.status(200).json({ user, session });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    if (message === 'Credenciales inválidas') {
      return res.status(401).json({ error: message });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: message });
  }
};
