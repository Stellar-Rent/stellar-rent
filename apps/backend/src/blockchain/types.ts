export interface MockBooking {
  id: string;
  propertyId: string;
  userId: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}
