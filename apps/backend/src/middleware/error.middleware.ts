import type { ErrorRequestHandler } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ZodError } from 'zod';

interface ErrorResponse {
  error: string;
  details?: Array<{ path?: string; message: string }>;
}

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  // Only log full stack traces in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  } else {
    console.error(`Error: ${err.message}`);
  }

  let statusCode = 500;
  const response: ErrorResponse = { error: 'Error interno del servidor' };

  if (err instanceof ZodError) {
    statusCode = 400;
    response.error = 'Error de validación';
    response.details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    response.error = 'Token inválido';
  } else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    response.error = 'Token expirado';
  } else if (err.name === 'PostgrestError') {
    statusCode = 400;
    response.error = 'Error de base de datos';
    response.details = [{ message: err.message }];
  }

  return res.status(statusCode).json(response);
};
