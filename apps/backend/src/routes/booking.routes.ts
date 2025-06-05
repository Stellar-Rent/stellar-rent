import { Router } from 'express';
import { getBooking } from '../controllers/booking.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/bookings/:bookingId', authenticateToken, getBooking);

export default router;
