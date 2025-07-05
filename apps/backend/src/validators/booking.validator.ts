import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import type { BookingRequest } from '../types/booking.types';
import { confirmPaymentSchema, createBookingSchema } from '../types/booking.types';

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

export const validateCreateBooking = (req: BookingRequest, res: Response, next: NextFunction) => {
  try {
    // Transform date strings to Date objects
    const transformedBody = {
      ...req.body,
      dates: {
        from: new Date(req.body.dates?.from),
        to: new Date(req.body.dates?.to),
      },
    };
    
    // Add user ID from authenticated session
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        details: [{ message: 'You must be logged in to create a booking' }],
      });
    }
    
    // Validate request body
    const validatedData = createBookingSchema.parse({
      ...transformedBody,
      userId,
    });
    
    // Attach the validated data to the request for use in controller
    req.validatedBooking = validatedData;
    
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
