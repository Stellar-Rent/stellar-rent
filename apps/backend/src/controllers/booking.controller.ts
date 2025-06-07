import type { Response } from 'express';
import type { BookingRequest, ConfirmPaymentInput } from '../types/booking.types';
import { confirmBookingPayment } from '../services/booking.service';
import {
  BookingNotFoundError,
  BookingPermissionError,
  BookingStatusError,
  TransactionValidationError
} from '../errors/booking.errors';

export const confirmPayment = async (req: BookingRequest, res: Response) => {
  try {
    const bookingId = req.params.bookingId;
    const userId = req.user?.id;
    const input: ConfirmPaymentInput = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required'
      });
    }

    // Log the payment confirmation attempt (without sensitive data in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Payment confirmation attempt:', {
        bookingId,
        userId,
        transactionHash: input.transactionHash.length > 8
          ? `${input.transactionHash.substring(0, 8)}...`
          : input.transactionHash
      });
    } else {
      console.log(`Payment confirmation attempt for booking ${bookingId}`);
    }

    const result = await confirmBookingPayment(bookingId, userId, input);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error confirming payment:', error);

    // Handle custom error types
    if (error instanceof BookingNotFoundError) {
      return res.status(404).json({
        error: 'Booking not found or access denied'
      });
    }

    if (error instanceof BookingPermissionError) {
      return res.status(403).json({
        error: error.message
      });
    }

    if (error instanceof BookingStatusError) {
      return res.status(400).json({
        error: error.message
      });
    }

    if (error instanceof TransactionValidationError) {
      return res.status(400).json({
        error: 'Transaction verification failed',
        details: [{ message: error.message }]
      });
    }

    // Generic server error for unhandled cases
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unhandled error in confirmPayment:', errorMessage);

    res.status(500).json({
      error: 'Failed to confirm payment',
      details: [{ message: 'Internal server error' }]
    });
  }
};
