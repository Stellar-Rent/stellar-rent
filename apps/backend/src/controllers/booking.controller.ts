import type { NextFunction, Response } from 'express';
import {
  cancelBooking as cancelBlockchainBooking,
  createBooking as createBlockchainBooking,
} from '../blockchain/bookingContract';
import { supabase } from '../config/supabase';
import {
  BookingNotFoundError,
  BookingPermissionError,
  BookingStatusError,
  TransactionValidationError,
} from '../errors/booking.errors';
import type { BookingService } from '../services/booking.service';
import type { AuthRequest } from '../types/auth.types';
import type { BookingRequest, ConfirmPaymentInput } from '../types/booking.types';
import { ParamsSchema, ResponseSchema } from '../types/booking.types';

/**
 * Get a booking by ID
 */
export const getBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = ParamsSchema.parse(req.params);

    if (!req.user?.id) {
      throw new BookingPermissionError('Unauthorized: Missing or invalid auth token');
    }

    const userId = req.user.id;
    const bookingService = req.app.locals.bookingService as BookingService;

    if (!bookingService) {
      throw new Error('Booking service not initialized');
    }

    const booking = await bookingService.getBookingById(bookingId, userId);

    if (!booking) {
      throw new BookingNotFoundError(`Booking with ID ${bookingId} not found`);
    }

    return res.status(200).json({
      success: true,
      data: ResponseSchema.parse(booking),
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    next(error);
  }
};

/**
 * Get all bookings for the authenticated user
 */
export const getBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      throw new BookingPermissionError('Unauthorized: Missing or invalid auth token');
    }

    const userId = req.user.id;
    const bookingService = req.app.locals.bookingService as BookingService;

    if (!bookingService) {
      throw new Error('Booking service not initialized');
    }

    // Fetch all bookings for this user
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, property:properties(*)')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch user bookings: ${error.message}`);
    }

    if (!bookings || bookings.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Transform to expected format
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      propertyId: booking.property_id,
      userId: booking.user_id,
      dates: {
        from: new Date(booking.dates.from),
        to: new Date(booking.dates.to),
      },
      guests: booking.guests,
      total: booking.total,
      deposit: booking.deposit,
      escrowAddress: booking.escrow_address,
      status: booking.status,
      createdAt: new Date(booking.created_at),
      updatedAt: new Date(booking.updated_at),
    }));

    return res.status(200).json({
      success: true,
      data: formattedBookings,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    next(error);
  }
};

/**
 * Create a new booking
 */
export const createBooking = async (req: BookingRequest, res: Response, next: NextFunction) => {
  try {
    const bookingData = req.validatedBooking;
    if (!bookingData) {
      throw new Error('Invalid booking data');
    }

    if (!req.user?.id) {
      throw new BookingPermissionError('Unauthorized: Missing or invalid auth token');
    }

    bookingData.userId = req.user?.id;

    const bookingService = req.app.locals.bookingService as BookingService;
    if (!bookingService) {
      throw new Error('Booking service not initialized');
    }

    const result = await bookingService.createBooking(bookingData);

    return res.status(201).json({
      success: true,
      data: ResponseSchema.parse(result),
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    next(error);
  }
};

/**
 * Confirm payment for a booking
 */
export const confirmPayment = async (req: BookingRequest, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = ParamsSchema.parse(req.params);
    const { transactionHash, amount } = req.body as ConfirmPaymentInput;

    if (!req.user?.id) {
      throw new BookingPermissionError('Unauthorized: Missing or invalid auth token');
    }

    const userId = req.user.id;
    const bookingService = req.app.locals.bookingService as BookingService;

    if (!bookingService) {
      throw new Error('Booking service not initialized');
    }

    const result = await bookingService.confirmBookingPayment(bookingId, userId, {
      transactionHash,
      amount,
    });

    return res.status(200).json({
      success: true,
      data: ResponseSchema.parse(result),
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    next(error);
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (req: BookingRequest, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = ParamsSchema.parse(req.params);

    if (!req.user?.id) {
      throw new BookingPermissionError('Unauthorized: Missing or invalid auth token');
    }

    const userId = req.user.id;
    const bookingService = req.app.locals.bookingService as BookingService;

    if (!bookingService) {
      throw new Error('Booking service not initialized');
    }

    // Check if booking exists and belongs to the user
    const booking = await bookingService.getBookingById(bookingId, userId);

    if (!booking) {
      throw new BookingNotFoundError(`Booking with ID ${bookingId} not found`);
    }

    const result = await bookingService.cancelBooking(bookingId, userId);

    return res.status(200).json({
      success: true,
      data: ResponseSchema.parse(result),
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    next(error);
  }
};
