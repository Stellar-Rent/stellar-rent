// src/middleware/auth.middleware.ts
import type { NextFunction, Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(403).json({ error: 'Token inválido o expirado' });

  req.user = user;
  next();
};
