export interface PropertyResponse {
  id: string;
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: { latitude: number; longitude: number };
  };
  amenities: string[];
  images: string[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  ownerId: string;
  status: 'available' | 'booked' | 'maintenance';
  availability: Array<{ from: string; to: string }>;
  securityDeposit: number;
  cancellationPolicy?: { daysBefore: number; refundPercentage: number };
  createdAt: string;
  updatedAt: string;
}
