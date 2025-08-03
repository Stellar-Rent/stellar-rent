// Shared types for the entire application
// This file centralizes common interfaces to avoid duplication and improve maintainability

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
  occupancyRate?: number;
  averageRating?: number;
  totalBookings?: number;
  monthlyEarnings?: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  description: string;
  transactionHash?: string;
}

export interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'system' | 'property';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  createdAt: string;
  userId: string;
}

export interface DashboardStats {
  totalBookings: number;
  totalEarnings: number;
  averageRating: number;
  activeProperties?: number;
  pendingBookings?: number;
  completedBookings?: number;
  upcomingBookings?: number;
  cancelledBookings?: number;
}

export interface FilterState {
  status: string;
  dateRange: string;
  searchTerm: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  propertyType?: string;
  priceRange?: string;
}

export interface APIResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form interfaces
export interface BookingFormData {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  deposit: number;
}

export interface PropertyFormData {
  title: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  description: string;
  propertyType: string;
  status: 'active' | 'inactive' | 'maintenance';
  amenities: string[];
  rules?: string;
}

export interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    pushNotifications: boolean;
  };
}

// API request interfaces
export interface BookingFilters {
  status?: string;
  dateRange?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  userId: string;
  userType?: 'host' | 'tenant';
}

export interface PropertyFilters {
  status?: string;
  propertyType?: string;
  priceRange?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  userId: string;
}

export interface NotificationFilters {
  type?: string;
  isRead?: boolean;
  priority?: string;
  userId: string;
} 