import { Router } from 'express';
import {
  cancelBooking,
  checkPropertyAvailability,
  confirmPayment,
  getBooking,
  getUserBookings,
  postBooking,
  updateBookingStatus,
} from '../controllers/booking.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateConfirmPayment } from '../validators/booking.validator';

const router = Router();

// Booking CRUD operations
router.post('/', authenticateToken, postBooking);
router.get('/:bookingId', authenticateToken, getBooking);
router.put('/:bookingId/cancel', authenticateToken, cancelBooking);
router.put('/:bookingId/status', authenticateToken, updateBookingStatus);

// User bookings
router.get('/', authenticateToken, getUserBookings);

// Payment confirmation
router.post(
  '/:bookingId/confirm-payment',
  authenticateToken,
  validateConfirmPayment,
  confirmPayment
);

// Property availability check
router.get('/availability/:propertyId', checkPropertyAvailability);

export default router;
