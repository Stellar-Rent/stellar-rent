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

// Property availability check (PUBLIC - no auth required)
router.get('/availability/:propertyId', checkPropertyAvailability);

// Booking CRUD operations
router.post('/', authenticateToken, postBooking);
router.get('/', authenticateToken, getUserBookings);

// Routes with :bookingId parameter (must come after concrete routes)
router.get('/:bookingId', authenticateToken, getBooking);
router.put('/:bookingId/cancel', authenticateToken, cancelBooking);
router.put('/:bookingId/status', authenticateToken, updateBookingStatus);

// Payment confirmation
router.post(
  '/:bookingId/confirm-payment',
  authenticateToken,
  validateConfirmPayment,
  confirmPayment
);

// Accept PUT per task.md while retaining POST for compatibility
router.put('/:bookingId/confirm', authenticateToken, validateConfirmPayment, confirmPayment);

export default router;
