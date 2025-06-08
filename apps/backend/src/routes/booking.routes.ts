import { Router } from 'express';
import { confirmPayment, getBooking } from '../controllers/booking.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateConfirmPayment } from '../validators/booking.validator';

const router = Router();

router.get('/bookings/:bookingId', authenticateToken, getBooking);

// POST /api/bookings/{bookingId}/confirm-payment
router.post(
  '/:bookingId/confirm-payment',
  authenticateToken,
  validateConfirmPayment,
  confirmPayment
);

export default router;
