import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

const propertyIdSchema = z.object({
  id: z.string().uuid('Invalid property ID format'),
});

const ownerIdSchema = z.object({
  ownerId: z.string().uuid('Invalid owner ID format'),
});

/**
 * Middleware to validate property ID in request parameters
 */
export function validatePropertyId(req: Request, res: Response, next: NextFunction): void {
  try {
    propertyIdSchema.parse(req.params);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to validate owner ID in request parameters
 */
export function validateOwnerId(req: Request, res: Response, next: NextFunction): void {
  try {
    ownerIdSchema.parse(req.params);
    next();
  } catch (error) {
    next(error);
  }
}
export { authenticateToken } from '../middleware/auth.middleware';
