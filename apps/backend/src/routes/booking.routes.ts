import { Router } from 'express';
import { postBooking } from '../controllers/bookingControllers';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/api/bookings', authenticateToken, postBooking);

export default router;
