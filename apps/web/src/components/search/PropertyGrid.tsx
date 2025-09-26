'use client';

import { PropertyCard } from './PropertyCard';
import type { Property } from '~/types/property';

interface PropertyGridProps {
  properties: Property[];
  onLoadMore?: () => void;
}

export const PropertyGrid = ({ properties, onLoadMore }: PropertyGridProps) => {
  // Map backend Property to PropertyCard expected shape
  const mappedProperties = properties.map((prop) => ({
    id: prop.id,
    title: prop.title,
    address: `${prop.location.city}, ${prop.location.country}`,
    image: prop.images[0] || '/images/default.jpg',
    maxPeople: prop.maxGuests,
    distance: Number.parseFloat(prop.distance || '0'),
    rating: prop.rating || 0,
    reviews: 0, // Not in backend, set to 0
    area: 0, // Not in backend, set to 0
    price: prop.price,
    currency: 'USD', // Assume USD
    period: 'per month',
    verified: true, // Assume verified for now
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {mappedProperties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
      {onLoadMore && properties.length > 0 && (
        <div className="col-span-full flex justify-center mt-4">
          <button
            onClick={onLoadMore}
            className="bg-primary text-black px-4 py-2 rounded-full"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};
