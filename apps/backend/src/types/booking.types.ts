import { z } from 'zod';
import type { AuthRequest } from './auth.types';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'ongoing';

export interface Booking {
  id: string;
  propertyId: string;
  userId: string;
  dates: { from: Date; to: Date };
  guests: number;
  total: number;
  deposit: number;
  escrowAddress: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingRequest extends AuthRequest {
  params: {
    bookingId: string;
  };
}

export interface BookingConfirmationResponse {
  id: string;
  status: BookingStatus;
  escrowAddress: string;
  updatedAt: string;
}

export const createBookingSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  userId: z.string().uuid('Invalid user ID'),
  dates: z
    .object({
      from: z.date().refine((date) => date >= new Date(), {
        message: 'The start date must be in the future',
      }),
      to: z.date(),
    })
    .refine((data) => data.to > data.from, {
      message: 'The end date must be later than the start date',
    }),
  guests: z.number().int('Guests must be an integer').positive('Guests must be positive'),
  total: z.number().positive('Total cost must be positive'),
  deposit: z.number().nonnegative('Deposit must be non-negative'),
});

export const BookingParamsSchema = z.object({
  bookingId: z.string().uuid(),
});

export const BookingResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  propertyId: z.string().uuid(),
  dates: z.object({
    from: z
      .string()
      .refine((val) => !Number.isNaN(Date.parse(val)), { message: 'Invalid from date' }),
    to: z.string().refine((val) => !Number.isNaN(Date.parse(val)), { message: 'Invalid to date' }),
  }),
  guests: z.number(),
  total: z.number(),
  deposit: z.number(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  escrowAddress: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const confirmPaymentSchema = z.object({
  transactionHash: z.string().min(10, 'Transaction hash is required and must be valid'),
  sourcePublicKey: z
    .string()
    .min(56, 'Source public key is required')
    .refine((v) => v.startsWith('G') && v.length === 56, 'Invalid Stellar public key'),
});

export interface ConflictingBooking {
  bookingId: string;
  dates: {
    from: Date;
    to: Date;
  };
}

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingResponse = z.infer<typeof BookingResponseSchema>;
export type BookingParams = z.infer<typeof BookingParamsSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
