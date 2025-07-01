import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { challengeRequestSchema, walletLoginSchema } from '../types/wallet-auth.types';

//===================
// Validate challenge request
//===================
export const validateChallengeRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    challengeRequestSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid challenge request data',
        details: error.errors,
      });
    }
    next(error);
  }
};

//===================
// Validate wallet login request
//===================
export const validateWalletLogin = (req: Request, res: Response, next: NextFunction) => {
  try {
    walletLoginSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid wallet login data',
        details: error.errors,
      });
    }
    next(error);
  }
};
