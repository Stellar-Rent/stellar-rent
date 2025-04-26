import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { loginSchema, registerSchema } from '../types/auth.types';

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos de inicio de sesión inválidos',
        details: error.errors,
      });
    }
    next(error);
  }
};

export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    registerSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos de registro inválidos',
        details: error.errors,
      });
    }
    next(error);
  }
};
