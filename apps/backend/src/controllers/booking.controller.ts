import type { NextFunction, Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { checkBookingAvailability } from '../blockchain/bookingContract';
import { verifyStellarTransaction } from '../blockchain/soroban';
import { supabase } from '../config/supabase';
import { confirmBookingPayment, getBookingById } from '../services/booking.service';
import { bookingService } from '../services/booking.service';
import type { AuthRequest } from '../types/auth.types';
import {
  BookingParamsSchema,
  BookingResponseSchema,
  createBookingSchema,
} from '../types/booking.types';
import { BookingError } from '../types/common.types';
import { type ApiResponse, formatErrorResponse } from '../types/shared.types';

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

    return res
      .status(201)
      .json({ success: true, data: booking, message: 'Booking created successfully' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(
        formatErrorResponse(
          'Validation error',
          error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        )
      );
    }

    if (error instanceof BookingError) {
      const statusMap: { [key: string]: number } = {
        UNAVAILABLE: 409,
        NOT_FOUND: 404,
        UNAUTHORIZED: 403,
        DB_FAIL: 500,
        ESCROW_FAIL: 500,
        BLOCKCHAIN_FAIL: 500,
      };
      const status = statusMap[error.code] || 500;
      return res.status(status).json(formatErrorResponse(error.message, error.details));
    }

    next(error);
  }
}

export const getBooking = async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = BookingParamsSchema.safeParse(req.params);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          message: 'Bad Request',
          details: parseResult.error.errors,
        },
      });
    }

    const { bookingId } = parseResult.data;
    const requesterUserId = req.user?.id as string;

    if (!requesterUserId) {
      return res.status(401).json(formatErrorResponse('User authentication required'));
    }

    const bookingDetails = await getBookingById(bookingId);

    const validResponse = BookingResponseSchema.safeParse(bookingDetails);
    if (!validResponse.success) {
      return res
        .status(500)
        .json(
          formatErrorResponse('Response validation failed', 'Data does not match expected schema')
        );
    }

    return res.status(200).json({ success: true, data: validResponse.data });
  } catch (error) {
    if (error instanceof BookingError) {
      const statusMap: { [key: string]: number } = {
        NOT_FOUND: 404,
        UNAUTHORIZED: 403,
      };
      const status = statusMap[error.code] || 500;
      return res.status(status).json({
        success: false,
        data: null,
        error: {
          message: error.message,
          details: error.details,
        },
      });
    }

    // Handle generic errors from mocks or other sources
    if (error instanceof Error) {
      const errorMessage = error.message;

      // Map common error messages to appropriate status codes
      if (errorMessage === 'Access denied') {
        return res.status(403).json({
          success: false,
          data: null,
          error: {
            message: 'Access denied',
            details: 'You do not have permission to access this booking.',
          },
        });
      }

      if (errorMessage === 'Booking not found') {
        return res.status(404).json({
          success: false,
          data: null,
          error: {
            message: 'Booking not found',
            details: 'The booking with the provided ID does not exist.',
          },
        });
      }

      if (errorMessage === 'Property not found') {
        return res.status(404).json({
          success: false,
          data: null,
          error: {
            message: 'Resource not found',
            details: 'Property not found',
          },
        });
      }

      if (errorMessage === 'Host user not found') {
        return res.status(404).json({
          success: false,
          data: null,
          error: {
            message: 'Resource not found',
            details: 'Host user not found',
          },
        });
      }
    }

    console.error('getBooking error:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        message: 'Internal Server Error',
        details: 'Something went wrong retrieving booking details.',
      },
    });
  }
};

export const confirmPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { transactionHash, sourcePublicKey } = req.body;
    const paramsValidation = BookingParamsSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      return res
        .status(400)
        .json(formatErrorResponse('Invalid booking ID', paramsValidation.error.errors));
    }
    const { bookingId } = paramsValidation.data;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(formatErrorResponse('User authentication required'));
    }

    const requiredFields = { bookingId, transactionHash, sourcePublicKey };
    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json(formatErrorResponse(`Missing required fields: ${missingFields.join(', ')}`));
    }

    const bookingDetails = await getBookingById(bookingId);
    if (!bookingDetails) {
      return res.status(404).json(formatErrorResponse('Booking not found'));
    }

    const expectedAmount = bookingDetails.total.toString();
    const expectedDestination = bookingDetails.escrow_address;

    if (!expectedDestination) {
      return res.status(500).json(formatErrorResponse('Booking missing escrow address'));
    }

    await verifyStellarTransaction(
      transactionHash,
      sourcePublicKey,
      expectedDestination,
      expectedAmount,
      'USDC'
    );

    const result = await confirmBookingPayment(bookingId, transactionHash);

    return res
      .status(200)
      .json({ success: true, data: result, message: 'Booking confirmed successfully' });
  } catch (error) {
    if (error instanceof BookingError) {
      const statusMap: { [key: string]: number } = {
        NOT_FOUND: 404,
        CONFIRM_FAIL: 400,
      };
      const status = statusMap[error.code] || 500;
      return res.status(status).json(formatErrorResponse(error.message, error.details));
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error confirming payment:', errorMessage);

    if (errorMessage.includes('Transaction verification failed')) {
      return res
        .status(400)
        .json(formatErrorResponse('Transaction verification failed', errorMessage));
    }

    return res.status(500).json(formatErrorResponse('Failed to confirm payment'));
  }
};

// Cancel booking endpoint
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = BookingParamsSchema.safeParse(req.params);
    if (!parseResult.success) {
      return res
        .status(400)
        .json(formatErrorResponse('Invalid booking ID', parseResult.error.errors));
    }

    const { bookingId } = parseResult.data;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(formatErrorResponse('User authentication required'));
    }

    const result = await bookingService.cancelBooking(bookingId, userId);

    return res
      .status(200)
      .json({ success: true, data: result, message: 'Booking cancelled successfully' });
  } catch (error) {
    if (error instanceof BookingError) {
      const statusMap: { [key: string]: number } = {
        NOT_FOUND: 404,
        UNAUTHORIZED: 403,
        INVALID_STATUS: 400,
        CANCEL_FAIL: 500,
      };
      const status = statusMap[error.code] || 500;
      return res.status(status).json(formatErrorResponse(error.message, error.details));
    }

    console.error('Cancel booking error:', error);
    return res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// Get user's bookings
export const getUserBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(formatErrorResponse('User authentication required'));
    }

    const querySchema = z.object({
      page: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val, 10) : 1)),
      limit: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val, 10) : 10)),
      status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'ongoing']).optional(),
    });

    const queryValidation = querySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res
        .status(400)
        .json(formatErrorResponse('Invalid query parameters', queryValidation.error.errors));
    }

    const { page, limit, status } = queryValidation.data;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('bookings')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: bookings, error, count } = await query;

    if (error) {
      console.error('Get user bookings error:', error);
      return res.status(500).json(formatErrorResponse('Failed to fetch bookings', error));
    }

    const responseData = {
      bookings,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };

    return res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error('Get user bookings error:', error);
    return res.status(500).json(formatErrorResponse('Internal server error'));
  }
};

// Check property availability
export const checkPropertyAvailability = async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      propertyId: z.string().uuid('Invalid property ID'),
      from: z.string().refine((date) => !Number.isNaN(Date.parse(date)), 'Invalid from date'),
      to: z.string().refine((date) => !Number.isNaN(Date.parse(date)), 'Invalid to date'),
    });

    const validation = schema.safeParse({
      propertyId: req.params.propertyId,
      ...req.query,
    });

    if (!validation.success) {
      return res.status(400).json(formatErrorResponse('Validation error', validation.error.errors));
    }

    const { propertyId, from, to } = validation.data;

    const isAvailable = await checkBookingAvailability(
      propertyId,
      new Date(from).toISOString(),
      new Date(to).toISOString()
    );

    return res.status(200).json({
      success: true,
      data: {
        propertyId,
        isAvailable,
        dates: { from, to },
      },
    });
  } catch (error) {
    console.error('Check availability error:', error);
    return res.status(500).json(formatErrorResponse('Failed to check availability'));
  }
};

// Update booking status (for property owners/hosts)
export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = BookingParamsSchema.safeParse(req.params);
    if (!parseResult.success) {
      return res
        .status(400)
        .json(formatErrorResponse('Invalid booking ID', parseResult.error.errors));
    }

    const statusSchema = z.object({
      status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'ongoing']),
    });

    const statusValidation = statusSchema.safeParse(req.body);
    if (!statusValidation.success) {
      return res
        .status(400)
        .json(formatErrorResponse('Invalid status', statusValidation.error.errors));
    }

    const { status: newStatus } = statusValidation.data;
    const { bookingId } = parseResult.data;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(formatErrorResponse('User authentication required'));
    }

    const result = await bookingService.updateBookingStatus(bookingId, newStatus, userId);

    return res
      .status(200)
      .json({ success: true, data: result, message: 'Booking status updated successfully' });
  } catch (error) {
    if (error instanceof BookingError) {
      const statusMap: { [key: string]: number } = {
        NOT_FOUND: 404,
        UNAUTHORIZED: 403,
        STATUS_UPDATE_FAIL: 500,
      };
      const status = statusMap[error.code] || 500;
      return res.status(status).json(formatErrorResponse(error.message, error.details));
    }

    console.error('Update booking status error:', error);
    return res.status(500).json(formatErrorResponse('Internal server error'));
  }
};
