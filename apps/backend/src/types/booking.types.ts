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

export const BookingParamsSchema = z.object({
  bookingId: z.string().uuid(),
});

export const BookingResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  propertyId: z.string().uuid(),
  dates: z.object({
    from: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid from date' }),
    to: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid to date' }),
  }),
  guests: z.number(),
  total: z.number(),
  deposit: z.number(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  escrowAddress: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});


export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingResponse = z.infer<typeof BookingResponseSchema>;
export type BookingParams = z.infer<typeof BookingParamsSchema>;