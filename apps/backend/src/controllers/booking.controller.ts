import type { Response } from 'express';
import { confirmBookingPayment } from '../services/booking.service';
import type { BookingRequest, ConfirmPaymentInput } from '../types/booking.types';

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
