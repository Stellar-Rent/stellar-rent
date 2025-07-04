import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
// import { createBooking } from '../services/booking.service';
import { createBookingSchema } from '../types/booking.types';

export async function postBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createBookingSchema.parse({
      ...req.body,
      dates: {
        from: new Date(req.body.dates.from),
        to: new Date(req.body.dates.to),
      },
    });

    // Placeholder response until service is implemented
    res.status(201).json({ booking: input });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    if ((error as any).code === 'UNAVAILABLE') {
      return res.status(409).json({ error: (error as any).message });
    }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    if ((error as any).code === 'ESCROW_FAIL') {
      return res.status(500).json({ error: (error as any).message });
    }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    if ((error as any).code === 'DB_FAIL') {
      return res.status(500).json({ error: (error as any).message });
    }
    next(error);
  }
}
