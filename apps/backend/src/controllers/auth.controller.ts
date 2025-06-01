import type { Request, Response } from 'express';
import { loginUser, registerUser } from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
  try {
    const { token, user } = await registerUser(req.body);
    res.status(201).json({ token, user });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    console.error('Error en registro:', errorMessage);

    if (errorMessage.includes('already registered')) {
      res.status(409).json({ error: 'El email ya está registrado' });
    } else if (errorMessage.includes('validación') || errorMessage.includes('validation')) {
      res.status(400).json({ error: 'Datos de entrada inválidos' });
    } else {
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { data, error } = await loginUser(req.body);
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json({ user: data.user, session: data.session });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    if (errorMessage === 'Usuario no encontrado' || errorMessage === 'Contraseña incorrecta') {
      res.status(401).json({ error: 'Credenciales inválidas' });
    } else {
      console.error('Error en login:', errorMessage);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};
