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

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
