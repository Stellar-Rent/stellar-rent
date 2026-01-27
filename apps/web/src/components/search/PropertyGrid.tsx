'use client';

import { useState } from 'react';
import { ErrorDisplay } from '../ui/error-display';
import { LoadingGrid } from '../ui/loading-skeleton';
import { PropertyCard } from './PropertyCard';

import type { FullPropertyProps } from 'public/mock-data';

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
  // Show error state
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

  // Show loading state for initial load (when no properties)
  if (isLoading && properties.length === 0) {
    return <LoadingGrid count={8} columns={3} />;
  }

  // Show empty state
  if (!isLoading && properties.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-400 text-lg">No properties found</p>
        <p className="text-gray-500 text-sm mt-2">Try adjusting your search filters</p>
      </div>
    );
  }

  // Show properties
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
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
            className="px-6 py-2 bg-secondary text-white rounded-full hover:bg-secondary/80 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default PropertyGrid;
