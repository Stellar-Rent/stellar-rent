import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { confirmBookingPayment, getBookingById } from '../services/booking.service';
import { bookingService } from '../services/booking.service';
import type { AuthRequest } from '../types/auth.types';
import {
  BookingParamsSchema,
  BookingResponseSchema,
  createBookingSchema,
} from '../types/booking.types';
import { BookingError } from '../types/common.types';

export async function postBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createBookingSchema.parse({
      ...req.body,
      dates: {
        from: new Date(req.body.dates.from),
        to: new Date(req.body.dates.to),
      },
    });

    const booking = await bookingService.createBooking(input);

    // Placeholder response until service is implemented
    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    if (error instanceof BookingError) {
      const status = error.code === 'UNAVAILABLE' ? 409 : 500;
      return res.status(status).json({ error: error.message });
    }

    next(error);
  }
}

export const getBooking = async (req: AuthRequest, res: Response) => {
  const parseResult = BookingParamsSchema.safeParse(req.params);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Bad Request',
        details: parseResult.error.format(),
      },
      data: null,
    });
  }
  const { bookingId } = parseResult.data;

  const requesterUserId = req.user?.id as string;
  if (!requesterUserId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Unauthorized',
        details: 'Missing or invalid auth token',
      },
      data: null,
    });
  }

  try {
    const bookingDetails = await getBookingById(bookingId);

    const validResponse = BookingResponseSchema.safeParse(bookingDetails);
    if (!validResponse.success) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Internal Server Error',
          details: 'Response data did not match expected schema',
        },
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      data: validResponse.data,
    });
  } catch (err: unknown) {
    let message: string;
    if (err instanceof Error) {
      message = err.message;
    } else {
      message = String(err);
    }

    if (message === 'Booking not found') {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Booking not found',
          details: 'The booking with the provided ID does not exist.',
        },
        data: null,
      });
    }

    if (message === 'Property not found' || message === 'Host user not found') {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Resource not found',
          details: message,
        },
        data: null,
      });
    }

    if (message === 'Access denied') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied',
          details: 'You do not have permission to access this booking.',
        },
        data: null,
      });
    }

    console.error('getBooking error:', err);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal Server Error',
        details: 'Something went wrong retrieving booking details.',
      },
      data: null,
    });
  }
};

export const confirmPayment = async (req: AuthRequest, res: Response) => {
  try {
    const escrowAddress = req.body.escrowAddress;
    const userId = req.user?.id;
    const transactionHash = req.body.transactionHash;

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required',
      });
    }

    if (!transactionHash) {
      return res.status(400).json({ error: 'transactionHash is required' });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Payment confirmation attempt:', {
        userId,
        transactionHash: `${transactionHash.substring(0, 8)}...`,
      });
    } else {
      console.log(`Payment confirmation attempt for booking ${transactionHash}`);
    }

    if (!escrowAddress) {
      return res.status(400).json({ error: 'escrowAddress is required' });
    }

    const result = await confirmBookingPayment(escrowAddress);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Booking confirmed successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error confirming payment:', errorMessage);

    if (errorMessage.includes('not found') || errorMessage.includes('permission')) {
      return res.status(404).json({
        error: 'Booking not found or access denied',
      });
    }

    if (errorMessage.includes('status:') || errorMessage.includes('Cannot confirm')) {
      return res.status(400).json({
        error: errorMessage,
      });
    }

    if (errorMessage.includes('Invalid') || errorMessage.includes('failed')) {
      return res.status(400).json({
        error: 'Transaction verification failed',
        details: [{ message: errorMessage }],
      });
    }

    res.status(500).json({
      error: 'Failed to confirm payment',
      details: [{ message: 'Internal server error' }],
    });
  }
};
