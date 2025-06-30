import { Router } from 'express';
import { cancelBooking, confirmPayment, createBooking, getBooking } from '../controllers/booking.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateCreateBooking } from '../validators/booking.validator';

const router = Router();

router.get('/:bookingId', authenticateToken, getBooking);
router.post('/:bookingId/confirm-payment', authenticateToken, confirmPayment);
router.post('/', authenticateToken, validateCreateBooking, createBooking);
router.delete('/:bookingId', authenticateToken, cancelBooking);

export default router;
