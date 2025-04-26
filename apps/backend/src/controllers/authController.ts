import type { Request, Response } from 'express';
import { loginUser, registerUser } from '../services/authService';

export const login = async (req: Request, res: Response) => {
  try {
    const { token, user } = await loginUser(req.body);
    res.status(200).json({ token, user });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === 'Usuario no encontrado' ||
        error.message === 'Contraseña incorrecta'
      ) {
        res.status(401).json({ error: 'Credenciales inválidas' });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    console.log('Iniciando registro con datos:', {
      email: req.body.email,
      name: req.body.name,
      // No logueamos la contraseña por seguridad
    });

    const { token, user } = await registerUser(req.body);
    res.status(201).json({ token, user });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error en registro:', error);
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  }
};
