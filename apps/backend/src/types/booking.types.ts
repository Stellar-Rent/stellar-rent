import { z } from 'zod';
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

export const ParamsSchema = z.object({
  bookingId: z.string().uuid(),
});

export const ResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  property_id: z.string().uuid(),
  dates: z.array(z.string()),
  guests: z.number(),
  total: z.number(),
  deposit: z.number(),
  status: z.string(),
  escrow_address: z.string().nullable().optional(),
  created_at: z.string(),
  // Add other fields returned by getBookingById if necessary
});


export type CreateBookingInput = z.infer<typeof createBookingSchema>;
