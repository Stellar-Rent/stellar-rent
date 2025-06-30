import type { Response } from 'express';
import { BookingService } from '../services/booking.service';
import { createBooking as createBlockchainBooking, cancelBooking as cancelBlockchainBooking } from '../blockchain/bookingContract';
import { supabase } from '../config/supabase';
import type { AuthRequest } from '../types/auth.types';
import type { BookingRequest, ConfirmPaymentInput } from '../types/booking.types';
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
    // Get booking service from app locals
    const bookingService = req.app.locals.bookingService;
    if (!bookingService) {
      throw new Error('Booking service not initialized');
    }
    
    const bookingDetails = await bookingService.getBookingById(bookingId, requesterUserId);

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

export const createBooking = async (req: BookingRequest, res: Response) => {
  try {
    // The validatedBooking will be attached by the validator middleware
    const bookingData = req.validatedBooking;
    const userId = req.user?.id;

    if (!bookingData) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid booking data',
          details: 'Required booking information is missing',
        },
        data: null,
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Unauthorized',
          details: 'Missing or invalid auth token',
        },
        data: null,
      });
    }

    // Format dates for blockchain compatibility
    const startDate = bookingData.dates.from.toISOString();
    const endDate = bookingData.dates.to.toISOString();
    
    // Create booking on blockchain
    const bookingId = await createBlockchainBooking(
      bookingData.propertyId,
      userId,
      startDate,
      endDate,
      bookingData.total
    );
    
    // Store booking data in database using the service
    const bookingService = req.app.locals.bookingService;
    if (!bookingService) {
      throw new Error('Booking service not initialized');
    }
    
    const result = await bookingService.createBooking({
      ...bookingData,
      userId, // Ensure we're using the authenticated user ID
    });
    
    return res.status(201).json({
      success: true,
      data: {
        ...result,
        blockchainBookingId: bookingId
      },
    });
  } catch (err: unknown) {
    // Narrow error to string
    let message: string;
    if (err instanceof Error) {
      message = err.message;
    } else {
      message = String(err);
    }

    console.error('createBooking error:', err);

    if (message.includes('availability') || message.includes('UNAVAILABLE')) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Property not available',
          details: message,
        },
        data: null,
      });
    }

    if (message.includes('validation') || message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: message,
        },
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal Server Error',
        details: 'Failed to create booking',
      },
      data: null,
    });
  }
};

export const confirmPayment = async (req: BookingRequest, res: Response) => {
  try {
    const bookingId = req.params.bookingId;
    const userId = req.user?.id;
    const input: ConfirmPaymentInput = {
      transactionHash: req.body.transactionHash as string,
      amount: Number(req.body.amount)
    };

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

    // Get booking service from app locals
    const bookingService = req.app.locals.bookingService;
    if (!bookingService) {
      throw new Error('Booking service not initialized');
    }

    const result = await bookingService.confirmBookingPayment(bookingId, userId, input);

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

export const cancelBooking = async (req: BookingRequest, res: Response) => {
  try {
    const bookingId = req.params.bookingId;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Unauthorized',
          details: 'Missing or invalid auth token',
        },
        data: null,
      });
    }

    // Validate UUID format
    if (!ParamsSchema.shape.bookingId.safeParse(bookingId).success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid booking ID',
          details: 'Booking ID must be a valid UUID',
        },
        data: null,
      });
    }

    // Get booking service from app locals
    const bookingService = req.app.locals.bookingService;
    if (!bookingService) {
      throw new Error('Booking service not initialized');
    }
    
    // First get the booking to check if the user is authorized to cancel it
    const booking = await bookingService.getBookingById(bookingId, userId);
    
    // Only the booking owner can cancel it
    if (booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Forbidden',
          details: 'You can only cancel your own bookings',
        },
        data: null,
      });
    }
    
    // Check if booking can be cancelled (only pending or confirmed bookings can be cancelled)
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid booking status',
          details: `Cannot cancel a booking with status: ${booking.status}`,
        },
        data: null,
      });
    }

    // Cancel booking on blockchain
    await cancelBlockchainBooking(bookingId, userId);

    // Update booking status in database
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError || !updatedBooking) {
      throw new Error('Failed to update booking status');
    }

    return res.status(200).json({
      success: true,
      data: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        cancelledAt: updatedBooking.updated_at,
      },
    });
  } catch (err: unknown) {
    // Narrow error to string
    let message: string;
    if (err instanceof Error) {
      message = err.message;
    } else {
      message = String(err);
    }

    console.error('cancelBooking error:', err);

    if (message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Booking not found',
          details: message,
        },
        data: null,
      });
    }

    if (message.includes('permission') || message.includes('access')) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied',
          details: message,
        },
        data: null,
      });
    }

    if (message.includes('status') || message.includes('cannot cancel')) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid booking status',
          details: message,
        },
        data: null,
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal Server Error',
        details: 'Failed to cancel booking',
      },
      data: null,
    });
  }
};
