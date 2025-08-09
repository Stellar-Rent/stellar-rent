export interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  rating: number;
  reviews: number;
  image: string;
  status: 'active' | 'inactive' | 'maintenance';
  bookings: number;
  earnings: number;
  description?: string;
  amenities?: string[];
  propertyType?: string;
  rules?: string;
}

export interface Booking {
  id: string;
  propertyTitle: string;
  propertyImage: string;
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  bookingDate: string;
  propertyId: string;
  escrowAddress?: string;
  transactionHash?: string;
  canCancel: boolean;
  canReview: boolean;
  guestName?: string;
  guestEmail?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  location?: string;
  bio?: string;
  memberSince: string;
  totalBookings: number;
  totalSpent: number;
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    pushNotifications: boolean;
  };
}
