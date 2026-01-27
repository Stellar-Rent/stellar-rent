// Re-export all types from shared file for backward compatibility
export * from './shared';

// Legacy types for backward compatibility
export interface DashboardBooking {
  id: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyImage: string;
  hostName: string;
  checkIn: string;
  checkOut: string;
  bookingDate: string;
  guests: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
  rating?: number;
  review?: string;
  canCancel?: boolean;
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
  phone?: string;
  location?: string;
  bio?: string;
  avatar: string;
  verified: boolean;
  memberSince: string;
  totalBookings: number;
  totalSpent?: number;
  publicKey?: string;
  // Host-related fields
  hostStatus?: 'pending' | 'verified' | 'rejected' | 'suspended';
  hasProperties?: boolean;
  preferences?: {
    currency: string;
    language: string;
    notifications: boolean;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    marketingEmails?: boolean;
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
  totalSpent?: number;
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
    canCancel: booking.canCancel ?? true,
  };
}

export function transformToLegacyUser(user: UserProfile): LegacyUserProfile {
  if (!user) {
    throw new Error('Invalid user data');
  }

  return {
    ...user,
    id: Number.parseInt(user.id) || 1,
    phone: user.phone || '',
    preferences: user.preferences || {
      currency: 'USD',
      language: 'en',
      notifications: true,
    },
  };
}

export function transformFromLegacyUser(user: LegacyUserProfile): UserProfile {
  if (!user) {
    throw new Error('Invalid user data');
  }

  return {
    ...user,
    id: user.id.toString(),
    totalBookings: 0,
  };
}

declare global {
  interface Window {
    freighterApi?: {
      isConnected: () => Promise<boolean>;
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      getPublicKey: () => Promise<string>;
      getNetwork: () => Promise<string>;
      signTransaction: (transaction: string) => Promise<string>;
    };
  }
}

// Dashboard Types
export interface DashboardProperty {
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
  occupancyRate?: number;
  averageRating?: number;
  totalBookings?: number;
  monthlyEarnings?: number;
}

export interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'review' | 'system' | 'message' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: {
    bookingId?: string;
    propertyId?: string;
    amount?: number;
    rating?: number;
    userId?: string;
  };
}

export interface AnalyticsData {
  overview: {
    totalBookings: number;
    totalEarnings: number;
    averageRating: number;
    totalProperties: number;
    activeBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalGuests: number;
  };
  trends: {
    bookings: { date: string; count: number; revenue: number }[];
    ratings: { date: string; average: number; count: number }[];
    occupancy: { date: string; rate: number }[];
  };
  topProperties: {
    id: number;
    title: string;
    bookings: number;
    revenue: number;
    rating: number;
    occupancyRate: number;
  }[];
  revenueBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  monthlyStats: {
    month: string;
    bookings: number;
    revenue: number;
    guests: number;
  }[];
}

export interface PropertyCalendarBooking {
  id: string;
  checkIn: Date;
  checkOut: Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  guestName: string;
  guests: number;
  totalAmount: number;
  propertyId: number;
}
