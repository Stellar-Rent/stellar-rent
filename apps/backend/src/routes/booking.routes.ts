import { Router } from 'express';
import { confirmPayment, getBooking } from '../controllers/booking.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/:bookingId', authenticateToken, getBooking);
router.post('/:bookingId/confirm-payment', authenticateToken, confirmPayment);

export default router;
