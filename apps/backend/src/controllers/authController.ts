import type { Request, Response } from 'express';
import { loginUser, registerUser } from '../services/authService';

export const login = async (req: Request, res: Response) => {
  try {
    const { token, user } = await loginUser(req.body);
    res.status(200).json({ token, user });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';

    if (
      errorMessage === 'Usuario no encontrado' ||
      errorMessage === 'Contraseña incorrecta'
    ) {
      res.status(401).json({ error: 'Credenciales inválidas' });
    } else if (errorMessage.includes('validation')) {
      res.status(400).json({ error: 'Datos de entrada inválidos' });
    } else {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    // Log registration attempt without PII in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('Iniciando registro con datos:', {
        email: req.body.email,
        name: req.body.name,
      });
    } else {
      console.log('Iniciando intento de registro');
    }

    const { token, user } = await registerUser(req.body);
    res.status(201).json({ token, user });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en registro:', errorMessage);

    if (errorMessage === 'El email ya está registrado') {
      res.status(409).json({ error: 'El email ya está registrado' });
    } else if (errorMessage.includes('validation')) {
      res.status(400).json({ error: 'Datos de entrada inválidos' });
    } else {
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  }
};
