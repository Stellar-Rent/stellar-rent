import type { Booking, Property, UserProfile } from './types';

export const mockProperties: Property[] = [
  {
    id: 1,
    title: 'Luxury Downtown Apartment',
    location: 'New York, NY',
    price: 250,
    bedrooms: 2,
    bathrooms: 2,
    guests: 4,
    rating: 4.8,
    reviews: 124,
    image:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
    status: 'active',
    bookings: 15,
    earnings: 3750,
  },
  {
    id: 2,
    title: 'Cozy Beach House',
    location: 'Miami, FL',
    price: 180,
    bedrooms: 3,
    bathrooms: 2,
    guests: 6,
    rating: 4.9,
    reviews: 89,
    image:
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop',
    status: 'active',
    bookings: 12,
    earnings: 2160,
  },
  {
    id: 3,
    title: 'Mountain Cabin Retreat',
    location: 'Aspen, CO',
    price: 320,
    bedrooms: 4,
    bathrooms: 3,
    guests: 8,
    rating: 4.7,
    reviews: 67,
    image:
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format&fit=crop',
    status: 'inactive',
    bookings: 8,
    earnings: 2560,
  },
];

export const mockEarnings = {
  totalEarnings: 8470,
  monthlyEarnings: 2340,
  pendingPayouts: 1250,
  transactions: [
    {
      id: 1,
      date: '2025-05-28',
      property: 'Luxury Downtown Apartment',
      amount: 250,
      status: 'completed',
    },
    { id: 2, date: '2025-05-26', property: 'Cozy Beach House', amount: 180, status: 'completed' },
    {
      id: 3,
      date: '2025-05-24',
      property: 'Mountain Cabin Retreat',
      amount: 320,
      status: 'pending',
    },
    {
      id: 4,
      date: '2025-05-22',
      property: 'Luxury Downtown Apartment',
      amount: 250,
      status: 'completed',
    },
    { id: 5, date: '2025-05-20', property: 'Cozy Beach House', amount: 180, status: 'completed' },
  ],
};

export const mockBookings: Booking[] = [
  {
    id: '1',
    propertyTitle: 'Luxury Downtown Apartment',
    propertyImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
    location: 'New York, NY',
    checkIn: '2025-06-15',
    checkOut: '2025-06-20',
    guests: 2,
    totalAmount: 1250,
    status: 'confirmed',
    bookingDate: '2025-05-28',
    propertyId: '1',
    escrowAddress: 'GCO2IP3MJNUOKS4PUDI4C7LGGMQDJGXG3COYX3WSB4HHNAHKYV5YL3VC',
    canCancel: true,
    canReview: false,
    guestName: 'Sarah Johnson',
    guestEmail: 'sarah.johnson@example.com',
  },
];

export const mockUser: UserProfile = {
  id: '1',
  name: 'John Smith',
  email: 'john.smith@example.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
  phone: '+1 (555) 987-6543',
  location: 'New York, NY',
  bio: 'Experienced property host with a passion for providing exceptional guest experiences.',
  memberSince: '2022',
  totalBookings: 45,
  totalSpent: 0,
  preferences: { notifications: true, emailUpdates: true, pushNotifications: false },
};
