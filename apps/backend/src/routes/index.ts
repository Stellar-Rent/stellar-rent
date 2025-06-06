import { Router } from 'express';
import authRouter from './auth';
import profileRouter from './profile.routes';

const router = Router();

// Prefix routes
router.use('/auth', authRouter); // e.g., /auth/login, /auth/register
router.use('/profile', profileRouter); // e.g., /profile/, /profile/avatar

export default router;
