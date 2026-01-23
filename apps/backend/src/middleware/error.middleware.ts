import type { ErrorRequestHandler } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ZodError } from 'zod';
import { BookingError } from '../types/common.types';
import { EscrowError, SyncError } from '../types/errors';

interface ErrorResponse {
  error: string;
  code?: string;
  details?: Array<{ path?: string; message: string }> | unknown;
}

// Map error codes to HTTP status codes
const errorCodeToStatus: Record<string, number> = {
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  ALREADY_PAID: 409,
  DUPLICATE_TRANSACTION: 409,
  DUPLICATE_EVENT: 409,
  UNAVAILABLE: 409,
  INVALID_STATUS: 400,
  INVALID_BUYER_WALLET: 400,
  INVALID_SELLER_WALLET: 400,
  DB_ERROR: 500,
  BLOCKCHAIN_FAIL: 502,
  ESCROW_CREATE_FAIL: 502,
  ESCROW_CANCEL_FAIL: 502,
  RELEASE_PAYMENT_FAIL: 502,
  RELEASE_DEPOSIT_FAIL: 502,
  SYNC_FAIL: 502,
  ATOMIC_PROCESS_FAIL: 500,
  POLL_EVENTS_FAIL: 502,
  GET_EVENTS_FAIL: 502,
};

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
  } else if (err instanceof BookingError) {
    statusCode = errorCodeToStatus[err.code] || 400;
    response.error = err.message;
    response.code = err.code;
    if (err.details && process.env.NODE_ENV !== 'production') {
      response.details = err.details;
    }
  } else if (err instanceof EscrowError) {
    statusCode = errorCodeToStatus[err.code] || 502;
    response.error = err.message;
    response.code = err.code;
    if (err.details && process.env.NODE_ENV !== 'production') {
      response.details = err.details;
    }
  } else if (err instanceof SyncError) {
    statusCode = errorCodeToStatus[err.code] || 500;
    response.error = err.message;
    response.code = err.code;
    if (err.details && process.env.NODE_ENV !== 'production') {
      response.details = err.details;
    }
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
