import { Router } from 'express';
import { confirmPayment, getBooking, postBooking } from '../controllers/booking.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateConfirmPayment } from '../validators/booking.validator';

const router = Router();

router.post('/', authenticateToken, postBooking);
router.get('/:bookingId', authenticateToken, getBooking);
router.post(
  '/:bookingId/confirm-payment',
  authenticateToken,
  validateConfirmPayment,
  confirmPayment
);

export default router;
