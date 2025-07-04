export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface MockBooking {
  id: string;
  propertyId: string;
  userId: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  totalPrice: number;
  status: BookingStatus;
}
