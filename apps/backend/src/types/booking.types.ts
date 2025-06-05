import { z } from 'zod';

export interface BookingsResponse {
  id: string;
  property: string;
  dates: { from: string; to: string };
  hostContact: string;
  escrowStatus: string;
}

export const ResponseSchema = z.object({
  id: z.string().uuid(),
  property: z.string(),
  dates: z.object({
    from: z.string(),
    to: z.string(),
  }),
  hostContact: z.string().email('Invalid Email'),
  escrowStatus: z.string(),
});

export const ParamsSchema = z.object({
  bookingId: z.string().uuid({ message: 'bookingId must be a valid UUID' }),
});
