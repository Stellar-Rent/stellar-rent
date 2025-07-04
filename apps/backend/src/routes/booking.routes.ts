import { Router } from 'express';
import { confirmPayment, getBooking } from '../controllers/booking.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateConfirmPayment } from '../validators/booking.validator';

const router = Router();

router.get('/:bookingId', authenticateToken, getBooking);
router.post(
  '/:bookingId/confirm-payment',
  authenticateToken,
  validateConfirmPayment,
  confirmPayment
);

export default router;
