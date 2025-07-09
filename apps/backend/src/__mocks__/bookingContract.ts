import type { BookingStatus, MockBooking } from '../blockchain/types';

// Mock storage for bookings
const mockBookings: MockBooking[] = [];

export async function checkBookingAvailability(
  propertyId: string,
  from: string,
  to: string
): Promise<boolean> {
  // Validate date strings
  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error('Invalid date format provided');
  }

  if (fromDate >= toDate) {
    throw new Error('From date must be before to date');
  }

  // Check if there's any overlap with existing bookings
  const hasOverlap = mockBookings.some((booking) => {
    if (booking.propertyId !== propertyId) return false;

    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);

    return (
      (fromDate >= bookingStart && fromDate < bookingEnd) || // New booking starts during existing booking
      (toDate > bookingStart && toDate <= bookingEnd) || // New booking ends during existing booking
      (fromDate <= bookingStart && toDate >= bookingEnd) // New booking completely encompasses existing booking
    );
  });

  return !hasOverlap;
}

// Helper function to add mock bookings (for testing)
export function addMockBooking(booking: MockBooking): void {
  mockBookings.push(booking);
}

// Helper function to clear mock bookings (for testing)
export function clearMockBookings(): void {
  mockBookings.length = 0;
}

// Create a new booking (mock implementation)
export async function createBooking(
  propertyId: string,
  userId: string,
  startDate: string,
  endDate: string,
  totalPrice: number
): Promise<string> {
  // Check if the property is available for these dates
  const isAvailable = await checkBookingAvailability(propertyId, startDate, endDate);
  if (!isAvailable) {
    throw new Error('Property is not available for the selected dates');
  }
  
  // Generate a mock booking ID
  const bookingId = String(Date.now());
  
  // Create a mock booking record
  const booking: MockBooking = {
    id: bookingId,
    propertyId,
    userId,
    startDate,
    endDate,
    totalPrice,
    status: 'pending'
  };
  
  mockBookings.push(booking);
  return bookingId;
}

// Cancel a booking (mock implementation)
export async function cancelBooking(
  bookingId: string,
  userId: string
): Promise<boolean> {
  const bookingIndex = mockBookings.findIndex(booking => booking.id === bookingId);
  
  if (bookingIndex === -1) {
    throw new Error('Booking not found');
  }
  
  const booking = mockBookings[bookingIndex];
  
  if (booking.userId !== userId) {
    throw new Error('Unauthorized: only the booking owner can cancel');
  }
  
  if (booking.status === 'completed' || booking.status === 'cancelled') {
    throw new Error('Invalid status: booking cannot be cancelled');
  }
  
  // Update the booking status
  booking.status = 'cancelled';
  mockBookings[bookingIndex] = booking;
  
  return true;
}

// Update booking status (mock implementation)
export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus
): Promise<boolean> {
  const bookingIndex = mockBookings.findIndex(booking => booking.id === bookingId);
  
  if (bookingIndex === -1) {
    throw new Error('Booking not found');
  }
  
  const booking = mockBookings[bookingIndex];
  
  // Validate status transition
  const validTransitions: Record<string, BookingStatus[]> = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': []
  };
  
  if (!validTransitions[booking.status].includes(newStatus)) {
    throw new Error('Invalid status transition');
  }
  
  // Update the booking status
  booking.status = newStatus;
  mockBookings[bookingIndex] = booking;
  
  return true;
}
