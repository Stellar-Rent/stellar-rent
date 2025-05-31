'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Heart, MapPin, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useInView } from 'react-intersection-observer';

// Types
type Property = {
  id: string;
  title: string;
  location: string;
  price: number;
  image: string;
  rating: number;
  distance: string;
};

// Mock data for properties
const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Modern Apartment with Kitchen',
    location: 'Luján, Buenos Aires',
    price: 2500,
    image: '/images/house1.jpg',
    rating: 4.1,
    distance: '30km',
  },
  {
    id: '2',
    title: 'Luxury Villa with Pool',
    location: 'Luján, Buenos Aires',
    price: 6000,
    image: '/images/house2.jpg',
    rating: 4.8,
    distance: '6km',
  },
  {
    id: '3',
    title: 'Cozy Bedroom Suite',
    location: 'Luján, Buenos Aires',
    price: 4500,
    image: '/images/house3.jpg',
    rating: 3.9,
    distance: '14km',
  },
  {
    id: '4',
    title: 'Elegant Studio Apartment',
    location: 'Luján, Buenos Aires',
    price: 5600,
    image: '/images/house4.jpg',
    rating: 4.5,
    distance: '8km',
  },
  {
    id: '5',
    title: 'Charming Kitchen Loft',
    location: 'Luján, Buenos Aires',
    price: 2100,
    image: '/images/house5.jpg',
    rating: 4.2,
    distance: '12km',
  },
  {
    id: '6',
    title: 'Modern Architectural House',
    location: 'Luján, Buenos Aires',
    price: 6500,
    image: '/images/house.jpg',
    rating: 4.7,
    distance: '10km',
  },
];

// Property Card Component
const PropertyCard = ({ property }: { property: Property }) => {
  // Use IntersectionObserver to detect when the card comes into view
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-500 ${inView ? 'opacity-100' : 'opacity-0'}`}
    >
      <Card className="overflow-hidden h-full">
        <div className="relative h-48 w-full">
          <div className="absolute top-2 left-2 z-10 bg-white/90 dark:bg-[#0B1D39]/90 px-2 py-1 rounded-md text-sm font-medium">
            ${property.price} <span className="text-xs">USDC</span>
          </div>
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/30 hover:bg-white/50 text-white"
            >
              <Heart className="w-5 h-5" />
            </Button>
          </div>
          <div className="absolute bottom-2 left-2 z-10 bg-white/90 dark:bg-[#0B1D39]/90 px-2 py-1 rounded-md text-xs font-medium flex items-center">
            <MapPin className="w-3 h-3 mr-1" /> {property.distance}
          </div>
          <div className="absolute bottom-2 right-2 z-10 bg-white/90 dark:bg-[#0B1D39]/90 px-2 py-1 rounded-md text-xs font-medium flex items-center">
            <Star className="w-3 h-3 mr-1 text-yellow-500" /> {property.rating}
          </div>
          {/* Fallback image with linear gradient if actual image fails to load */}
          <div className="relative h-full w-full">
            <Image
              src={property.image}
              alt={property.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{property.title}</h3>
          <p className="text-muted-foreground text-sm mb-3 flex items-center">
            <MapPin className="w-4 h-4 mr-1" /> {property.location}
          </p>
          <Button asChild className="w-full">
            <Link href={`/property/${property.id}`}>View Details</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};

// Fallback loading component
const PropertyCardSkeleton = () => (
  <Card className="overflow-hidden h-full">
    <div className="h-48 w-full bg-muted animate-pulse" />
    <div className="p-4">
      <div className="h-6 bg-muted animate-pulse rounded mb-2" />
      <div className="h-4 bg-muted animate-pulse rounded mb-4 w-3/4" />
      <div className="h-10 bg-muted animate-pulse rounded" />
    </div>
  </Card>
);

// Main component
export const FeaturedProperties = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-blue-50 dark:from-[#0B1D39] dark:to-[#071429]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Properties</h2>
          <p className="text-muted-foreground max-w-2xl">
            Discover our handpicked selection of premium properties available for rent with
            cryptocurrency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Suspense
            fallback={Array(6)
              .fill(0)
              .map((_, _idx) => (
                <PropertyCardSkeleton
                  key={`property-skeleton-${Math.random().toString(36).substring(2, 9)}`}
                />
              ))}
          >
            {MOCK_PROPERTIES.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </Suspense>
        </div>
      </div>
    </section>
  );
};
