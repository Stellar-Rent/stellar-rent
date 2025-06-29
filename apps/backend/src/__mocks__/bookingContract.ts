import type { MockBooking } from '../blockchain/types';

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
