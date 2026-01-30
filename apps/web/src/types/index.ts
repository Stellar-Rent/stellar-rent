export * from './shared';

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
  publicKey?: string;
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

export function transformToLegacyBooking(booking: DashboardBooking): LegacyBooking {
  if (!booking) throw new Error('Invalid booking data');
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
      booking.status === 'pending' || booking.status === 'confirmed'
        ? 'upcoming'
        : (booking.status as any),
    bookingDate: booking.bookingDate,
    hostName: booking.hostName,
    rating: booking.rating,
    canCancel: (booking as any).canCancel ?? true,
  };
}

export function transformToLegacyUser(user: UserProfile): LegacyUserProfile {
  if (!user) throw new Error('Invalid user data');
  return {
    ...user,
    id: Number.parseInt(user.id) || 1,
    phone: user.phone || '',
    preferences: user.preferences || { currency: 'USD', language: 'en', notifications: true },
  } as LegacyUserProfile;
}
