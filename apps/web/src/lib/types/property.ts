import type { DateRange } from 'react-day-picker';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface NeighborhoodInfo {
  walkability: string;
  transitScore: string;
  bikeScore: string;
  restaurants: string;
  grocery: string;
  publicTransit: string;
}

export interface PropertyPolicies {
  cancellation: string;
  checkIn: string;
  checkOut: string;
  deposit: number;
}

export interface PropertyAvailability {
  unavailableDates: Date[];
  minNights: number;
}

export interface Property {
  id: string;
  title: string;
  location: string;
  address: string;
  price: number;
  images: string[];
  rating: number;
  reviewCount: number;
  distance: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  description: string;
  policies: PropertyPolicies;
  coordinates: Coordinates;
  availability: PropertyAvailability;
  neighborhoodInfo: NeighborhoodInfo;
}

export interface PropertyReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  helpful: number;
}

export interface PropertyCardProps {
  property: Property;
}

export interface PropertyDetailProps {
  id: string;
}

export interface PropertyMapProps {
  address: string;
  coordinates?: Coordinates;
  neighborhoodInfo?: NeighborhoodInfo;
  className?: string;
}

export interface PropertyReviewsSectionProps {
  propertyId: string;
  averageRating?: number;
  totalReviews?: number;
  className?: string;
}

export interface PropertyCalendarProps {
  unavailableDates?: Date[];
  onDateSelect?: (dateRange: DateRange | undefined) => void;
  selectedDates?: DateRange | undefined;
  minNights?: number;
  className?: string;
}

export interface PropertyImageGalleryProps {
  images: string[];
  title: string;
  className?: string;
}

export type AvailabilityStatus = 'available' | 'limited' | 'booked';
