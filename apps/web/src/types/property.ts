import type { AvailabilityRange } from '../../types/shared'; // Assuming shared types if needed, adjust if not

export interface PropertyLocation {
  address: string;
  city: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface CancellationPolicy {
  daysBefore: number;
  refundPercentage: number;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: PropertyLocation;
  amenities: string[];
  images: string[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  ownerId: string;
  propertyToken?: string | null;
  status: 'available' | 'booked' | 'maintenance';
  availability: AvailabilityRange[];
  securityDeposit: number;
  cancellationPolicy?: CancellationPolicy;
  createdAt: string;
  updatedAt: string;
  // Frontend-specific additions (from mock, compute if needed)
  rating?: number;
  distance?: string;
}

export interface SearchPropertiesResponse {
  properties: Property[];
  total: number;
  page: number;
  limit: number;
}

export interface PropertySearchFilters {
  city?: string;
  country?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
  amenities?: string;
  status?: 'available' | 'booked' | 'maintenance';
  from?: string;
  to?: string;
}

export interface PropertySearchOptions {
  page?: number;
  limit?: number;
  sort_by?: 'price' | 'created_at' | 'title';
  sort_order?: 'asc' | 'desc';
}
