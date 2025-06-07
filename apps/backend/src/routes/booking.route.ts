import { Router } from 'express';
import { confirmPayment } from '../controllers/booking.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateConfirmPayment } from '../validators/booking.validator';

const router = Router();

// POST /api/bookings/{bookingId}/confirm-payment
router.post(
  '/:bookingId/confirm-payment',
  authenticateToken,
  validateConfirmPayment,
  confirmPayment
);

export default router;
