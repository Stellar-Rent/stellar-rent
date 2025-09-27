'use client';

import { useState } from 'react';
import { ErrorDisplay } from '~/components/ui/error-display';
import { PropertyCardSkeleton } from '~/components/ui/skeleton';
import { PropertyCard } from './PropertyCard';

// Mock data for properties
const mockProperties = [
  {
    id: 1,
    title: 'Luxury Studio in SoHo',
    address: '158 Greene St, New York, NY',
    image: '/images/house1.webp',
    maxPeople: 2,
    distance: 0.8,
    rating: 4.8,
    reviews: 114,
    area: 40,
    price: 3200,
    currency: 'USD',
    period: 'per month',
    verified: true,
  },
  {
    id: 2,
    title: 'Modern Loft in Downtown',
    address: '1122 S Main St, Los Angeles, CA',
    image: '/images/house2.webp',
    maxPeople: 2,
    distance: 1.5,
    rating: 4.6,
    reviews: 54,
    area: 55,
    price: 2800,
    currency: 'USD',
    period: 'per month',
    verified: true,
  },
  {
    id: 3,
    title: 'Penthouse in Brickell',
    address: '950 Brickell Bay Dr, Miami, FL',
    image: '/images/house3.webp',
    maxPeople: 4,
    distance: 2.0,
    rating: 4.9,
    reviews: 84,
    area: 100,
    price: 5100,
    currency: 'USD',
    period: 'per month',
    verified: true,
  },
  {
    id: 4,
    title: 'Cozy Condo near Pike Place',
    address: '1410 2nd Ave, Seattle, WA',
    image: '/images/house4.webp',
    maxPeople: 2,
    distance: 1.8,
    rating: 4.2,
    reviews: 162,
    area: 50,
    price: 2950,
    currency: 'USD',
    period: 'per month',
    verified: true,
  },
  {
    id: 5,
    title: 'Designer Apartment',
    address: '1234 Design St, San Francisco, CA',
    image: '/images/house5.webp',
    maxPeople: 3,
    distance: 1.2,
    rating: 4.7,
    reviews: 89,
    area: 65,
    price: 3800,
    currency: 'USD',
    period: 'per month',
    verified: true,
  },
  {
    id: 6,
    title: 'Waterfront Home in Santa Monica',
    address: '567 Ocean Blvd, Santa Monica, CA',
    image: '/images/house.webp',
    maxPeople: 6,
    distance: 0.5,
    rating: 4.9,
    reviews: 203,
    area: 120,
    price: 7500,
    currency: 'USD',
    period: 'per month',
    verified: true,
  },
  {
    id: 7,
    title: 'High-Rise in The Loop',
    address: '789 Michigan Ave, Chicago, IL',
    image: '/images/house1.webp',
    maxPeople: 2,
    distance: 1.1,
    rating: 4.5,
    reviews: 76,
    area: 45,
    price: 2600,
    currency: 'USD',
    period: 'per month',
    verified: true,
  },
  {
    id: 8,
    title: 'Smart Home in Austin',
    address: '321 Tech Blvd, Austin, TX',
    image: '/images/house2.webp',
    maxPeople: 4,
    distance: 2.3,
    rating: 4.8,
    reviews: 95,
    area: 85,
    price: 4200,
    currency: 'USD',
    period: 'per month',
    verified: true,
  },
];

export interface Property {
  id: number;
  title: string;
  address: string;
  image: string;
  maxPeople: number;
  distance: number;
  rating: number;
  reviews: number;
  area: number;
  price: number;
  currency: string;
  period: string;
  verified: boolean;
}

interface PropertyGridProps {
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  properties?: Property[];
  onLoadMore?: () => void;
}

export const PropertyGrid = ({
  isLoading = false,
  error = null,
  onRetry,
  properties: externalProperties,
  onLoadMore,
}: PropertyGridProps) => {
  const [internalProperties] = useState(mockProperties);
  const properties = externalProperties || internalProperties;

  const handleRetry = async () => {
    onRetry?.();
  };

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={handleRetry}
        title="Failed to load properties"
        variant="default"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 2xl:gap-8">
        {Array.from({ length: 8 }, (_, index) => (
          <PropertyCardSkeleton key={`property-skeleton-${Math.random()}-${index}`} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 2xl:gap-8">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
      {onLoadMore && (
        <div className="text-center mt-8">
          <button
            type="button"
            onClick={onLoadMore}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load More Properties
          </button>
        </div>
      )}
    </div>
  );
};
