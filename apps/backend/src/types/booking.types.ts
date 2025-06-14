import type { Request } from 'express';
import { z } from 'zod';
import type { AuthRequest } from './auth.types';

export interface BookingRequest extends AuthRequest {
  params: {
    bookingId: string;
  };
}

// Database booking interface
export interface Booking {
  id: string;
  user_id: string;
  property_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  start_date: string;
  end_date: string;
  escrow_address?: string;
  transaction_hash?: string;
  created_at: string;
  updated_at: string;
}

// Validation schemas
export const ParamsSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID format'),
});

export const ResponseSchema = z.object({
  id: z.string(),
  property: z.string(),
  dates: z.object({
    from: z.string(),
    to: z.string(),
  }),
  hostContact: z.string(),
  escrowStatus: z.string(),
});

export type BookingsResponse = z.infer<typeof ResponseSchema>;

// Confirm payment request schema
export const confirmPaymentSchema = z.object({
  transactionHash: z
    .string()
    .min(1, 'Transaction hash is required')
    .regex(/^[A-Fa-f0-9]{64}$/, 'Invalid Stellar transaction hash format'),
});

export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;

// Response interfaces
export interface ConfirmPaymentResponse {
  bookingId: string;
  status: string;
  message: string;
}

export interface BookingErrorResponse {
  error: string;
  details?: Array<{ path?: string; message: string }>;
}
