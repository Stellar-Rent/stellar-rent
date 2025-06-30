import { Router } from 'express';
import {
  authenticateWalletController,
  generateChallenge,
} from '../controllers/wallet-auth.controller';
import { challengeRateLimit, walletAuthRateLimit } from '../middleware/rateLimiter';
import { validateChallengeRequest, validateWalletLogin } from '../validators/wallet-auth.validator';

const router = Router();

//===================
// Generate challenge route for wallet authentication
//===================
router.post('/challenge', challengeRateLimit, validateChallengeRequest, generateChallenge);

//===================
// Authenticate with wallet signature route
//===================
router.post('/wallet', walletAuthRateLimit, validateWalletLogin, authenticateWalletController);

export default router;
