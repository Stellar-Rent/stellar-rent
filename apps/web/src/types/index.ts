export interface DashboardBooking {
  id: string;
  user_id?: string;
  property_id?: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyImage: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  bookingDate: string;
  hostName: string;
  canCancel: boolean;
  guests: number;
  status: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
  rating?: number;
  transaction_hash?: string;
  escrow_address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LegacyBooking {
  id: number;
  propertyTitle: string;
  propertyLocation: string;
  propertyImage: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  bookingDate: string;
  hostName: string;
  rating?: number;
  canCancel: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  memberSince: string;
  verified: boolean;
  location?: string;
  bio?: string;
  preferences: {
    currency: string;
    language: string;
    notifications: boolean;
  };
}

export interface LegacyUserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  memberSince: string;
  verified: boolean;
  location?: string;
  bio?: string;
  preferences: {
    currency: string;
    language: string;
    notifications: boolean;
  };
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'payment' | 'refund' | 'deposit';
  status: 'completed' | 'pending' | 'failed';
  bookingId?: number;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ConfirmPaymentInput {
  transactionHash: string;
}

export interface ConfirmPaymentResponse {
  bookingId: string;
  status: string;
  message: string;
}

export function transformToLegacyBooking(booking: DashboardBooking): LegacyBooking {
  if (!booking) {
    throw new Error('Invalid booking data');
  }

  return {
    id: Number.parseInt(booking.id) || 0,
    propertyTitle: booking.propertyTitle,
    propertyLocation: booking.propertyLocation,
    propertyImage: booking.propertyImage,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guests,
    totalAmount: booking.totalAmount,
    status:
      booking.status === 'pending'
        ? 'upcoming'
        : booking.status === 'confirmed'
          ? 'upcoming'
          : (booking.status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled'),
    bookingDate: booking.bookingDate,
    hostName: booking.hostName,
    rating: booking.rating,
    canCancel: booking.canCancel,
  };
}

export function transformToLegacyUser(user: UserProfile): LegacyUserProfile {
  if (!user) {
    throw new Error('Invalid user data');
  }

  return {
    ...user,
    id: Number.parseInt(user.id) || 1,
  };
}

export function transformFromLegacyUser(user: LegacyUserProfile): UserProfile {
  if (!user) {
    throw new Error('Invalid user data');
  }

  return {
    ...user,
    id: user.id.toString(),
  };
}
