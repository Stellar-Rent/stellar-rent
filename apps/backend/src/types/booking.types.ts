import { z } from 'zod';
import type { Request } from 'express';
import type { User as SupabaseUser } from '@supabase/supabase-js';
export interface Booking {
  id: string;
  propertyId: string;
  userId: string;
  dates: { from: Date; to: Date };
  guests: number;
  total: number;
  deposit: number;
  escrowAddress: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
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

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const confirmPaymentSchema = z.object({
  transactionHash: z.string().min(1, 'Transaction hash is required'),
  amount: z.number().positive('Amount must be positive'),
});

export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;

// Schema for request parameters
export const ParamsSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID format')
});

// Schema for booking response
export const ResponseSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  userId: z.string(),
  dates: z.object({
    from: z.date(),
    to: z.date()
  }),
  guests: z.number().int(),
  total: z.number(),
  deposit: z.number(),
  escrowAddress: z.string(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Extend Request to include user from auth middleware and validated data
export interface BookingRequest extends Request {
  user?: SupabaseUser;
  validatedBooking?: CreateBookingInput;
  // These properties are already part of Express.Request
  body: Record<string, unknown>;
  params: {
    [key: string]: string;
  };
}
