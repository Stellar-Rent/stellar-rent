import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import type { BookingRequest } from '../types/booking.types';
import { confirmPaymentSchema } from '../types/booking.types';

export const validateConfirmPayment = (req: BookingRequest, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    confirmPaymentSchema.parse(req.body);

    // Validate bookingId parameter is a valid UUID format
    const bookingIdSchema = z.string().uuid('Invalid booking ID format');
    bookingIdSchema.parse(req.params.bookingId);

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    next(error);
  }
};
