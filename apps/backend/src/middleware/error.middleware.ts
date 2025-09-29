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
  const response: ErrorResponse = { error: 'Internal server error' };

  if (err instanceof ZodError) {
    statusCode = 400;
    response.error = 'Validation error';
    response.details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    response.error = 'Invalid token';
  } else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    response.error = 'Token expired';
  } else if (err.name === 'PostgrestError') {
    statusCode = 400;
    response.error = 'Database error';
    response.details = [{ message: err.message }];
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    response.error = 'Validation error';
    response.details = [{ message: err.message }];
  }

  return res.status(statusCode).json(response);
};
