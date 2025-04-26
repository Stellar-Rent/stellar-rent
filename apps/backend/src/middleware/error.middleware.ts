import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err.stack);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
};
