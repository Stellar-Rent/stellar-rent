import type { Response } from 'express';
import { confirmBookingPayment, getBookingById } from '../services/booking.service';
import type { AuthRequest } from '../types/auth.types';
import { ParamsSchema, ResponseSchema } from '../types/booking.types';

export const getBooking = async (req: AuthRequest, res: Response) => {
  const parseResult = ParamsSchema.safeParse(req.params);
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
    const bookingDetails = await getBookingById(bookingId, requesterUserId);

    const validResponse = ResponseSchema.safeParse(bookingDetails);
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

    // 5) Return wrapped success object
    return res.status(200).json({
      success: true,
      data: validResponse.data,
    });
  } catch (err: unknown) {
    // 6) Narrow error to string
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

export const confirmPayment = async (req: BookingRequest, res: Response) => {
  try {
    const bookingId = req.params.bookingId;
    const userId = req.user?.id;
    const input: ConfirmPaymentInput = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required',
      });
    }

    // Log the payment confirmation attempt (without sensitive data in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Payment confirmation attempt:', {
        bookingId,
        userId,
        transactionHash: `${input.transactionHash.substring(0, 8)}...`,
      });
    } else {
      console.log(`Payment confirmation attempt for booking ${bookingId}`);
    }

    const result = await confirmBookingPayment(bookingId, userId, input);

    res.status(200).json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error confirming payment:', errorMessage);

    // Handle specific error types
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

    // Generic server error
    res.status(500).json({
      error: 'Failed to confirm payment',
      details: [{ message: 'Internal server error' }],
    });
  }
};
