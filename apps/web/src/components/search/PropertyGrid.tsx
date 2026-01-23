'use client';

import { PropertyCard } from './PropertyCard';

// Flexible interface that supports both internal mock data and FullPropertyProps from search
interface Property {
  id: number | string;
  title: string;
  address?: string;
  location?: string;
  image?: string;
  images?: string[];
  maxPeople?: number;
  maxGuests?: number;
  bedrooms?: number;
  distance: number | string;
  rating: number;
  reviews?: number;
  area?: number;
  price: number;
  currency?: string;
  period?: string;
  verified?: boolean;
  amenities?: string[];
}

interface PropertyGridProps {
  properties?: Property[];
  onLoadMore?: () => void;
}

// Mock data for properties (fallback)
const mockProperties: Property[] = [
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
    image: '/images/house1.webp',
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
    image: '/images/house.webp',
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
    image: '/images/house1.webp',
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
    image: '/images/house.webp',
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
    image: '/images/house1.webp',
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

const PropertyGrid = ({ properties, onLoadMore: _onLoadMore }: PropertyGridProps) => {
  // Use passed properties or fall back to mock data
  const displayProperties = properties || mockProperties;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 py-4">
      {displayProperties.map((property) => {
        // Map property to match PropertyCard's expected format
        const cardProperty = {
          id: typeof property.id === 'string' ? Number.parseInt(property.id, 10) || 0 : property.id,
          title: property.title,
          address: property.address || property.location || '',
          image: property.image || property.images?.[0] || '/images/house.webp',
          maxPeople: property.maxPeople || property.maxGuests || 2,
          distance:
            typeof property.distance === 'string'
              ? Number.parseFloat(property.distance) || 0
              : property.distance,
          rating: property.rating,
          reviews: property.reviews || 0,
          area: property.area || (property.bedrooms ? property.bedrooms * 20 : 50),
          price: property.price,
          currency: property.currency || 'USD',
          period: property.period || 'per month',
          verified: property.verified !== undefined ? property.verified : true,
        };
        return <PropertyCard key={property.id} property={cardProperty} />;
      })}
    </div>
  );
};

export default PropertyGrid;
