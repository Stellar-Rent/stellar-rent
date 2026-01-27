'use client';

import { useState } from 'react';
import type { FullPropertyProps } from 'public/mock-data';
import { ErrorDisplay } from '../ui/error-display';
import { LoadingGrid } from '../ui/loading-skeleton';
import { PropertyCard } from './PropertyCard';

interface PropertyGridProps {
  properties?: FullPropertyProps[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onLoadMore?: () => void;
}

const PropertyGrid = ({
  properties = [],
  isLoading = false,
  error = null,
  onRetry,
  onLoadMore,
}: PropertyGridProps) => {
  // Show error state (from error-handling)
  if (error) {
    return (
      <div className="py-12">
        <ErrorDisplay
          title="Failed to load properties"
          message={error}
          onRetry={onRetry}
          variant="destructive"
        />
      </div>
    );
  }

  // Show loading state for initial load (from error-handling)
  if (isLoading && properties.length === 0) {
    return <LoadingGrid count={8} columns={3} />;
  }

  // Show empty state (from error-handling)
  if (!isLoading && properties.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-400 text-lg">No properties found</p>
        <p className="text-gray-500 text-sm mt-2">Try adjusting your search filters</p>
      </div>
    );
  }

  // Show properties with main branch's grid improvements
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 py-4">
        {properties.map((property) => {
          // Property mapping logic (from main) to ensure compatibility with PropertyCard
          const cardProperty = {
            id: typeof property.id === 'string' ? Number.parseInt(property.id, 10) || 0 : property.id,
            title: property.title,
            address: property.location || '',
            image: property.images?.[0] || '/images/house.webp',
            maxPeople: property.maxGuests || 2,
            distance: typeof property.distance === 'string' 
              ? Number.parseFloat(property.distance) || 0 
              : property.distance,
            rating: property.rating,
            reviews: property.reviews || 0,
            area: property.bedrooms ? property.bedrooms * 20 : 50,
            price: property.price,
            currency: 'USD',
            period: 'per night',
            verified: true,
          };
          
          return <PropertyCard key={property.id} property={cardProperty as any} />;
        })}
      </div>

      {isLoading && properties.length > 0 && (
        <div className="flex justify-center py-4">
          <LoadingGrid count={3} columns={3} />
        </div>
      )}

      {!isLoading && onLoadMore && properties.length > 0 && (
        <div className="flex justify-center py-4">
          <button
            type="button"
            onClick={onLoadMore}
            className="px-6 py-2 bg-[#0B1D39] text-white rounded-full hover:opacity-90 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default PropertyGrid;