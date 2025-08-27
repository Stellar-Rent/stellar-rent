'use client';

import { Heart, MapPin, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAvailabilityStatus, getFeaturedProperties } from '@/lib/data/properties';
import type { PropertyCardProps } from '@/lib/types/property';

// Property Card Component
const PropertyCard = ({ property }: PropertyCardProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const availabilityStatus = getAvailabilityStatus(property.id);

  const getAvailabilityBadge = () => {
    switch (availabilityStatus) {
      case 'available':
        return (
          <span className="h-fit px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            Available
          </span>
        );
      case 'limited':
        return (
          <span className="h-fit px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            Limited
          </span>
        );
      case 'booked':
        return (
          <span className="h-fit px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            Booked
          </span>
        );
    }
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow duration-300">
        <div className="relative h-48 w-full group">
          <div className="absolute top-3 left-3 z-10 bg-white/90 dark:bg-[#0B1D39]/90 px-2 py-1 rounded-md text-sm font-medium">
            ${property.price} <span className="text-xs">USDC</span>
          </div>
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/30 hover:bg-white/50 text-white backdrop-blur-sm"
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>
          <div className="absolute bottom-3 left-3 z-10 bg-white/90 dark:bg-[#0B1D39]/90 px-2 py-1 rounded-md text-xs font-medium flex items-center">
            <MapPin className="w-3 h-3 mr-1" /> {property.distance}
          </div>
          <div className="absolute bottom-3 right-3 z-10 bg-white/90 dark:bg-[#0B1D39]/90 px-2 py-1 rounded-md text-xs font-medium flex items-center">
            <Star className="w-3 h-3 mr-1 text-yellow-500" /> {property.rating}
          </div>

          <div className="relative h-full w-full overflow-hidden">
            <Image
              src={property.images[0] || '/placeholder.svg'}
              alt={property.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>

        <div className="p-4">
          <div className="flex justify-between w-full">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{property.title}</h3>
            {getAvailabilityBadge()}
          </div>
          <p className="text-muted-foreground text-sm mb-3 flex items-center">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{property.location}</span>
          </p>

          {/* Quick info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span>Up to {property.maxGuests} guests</span>
            <span>{property.bedrooms} bedrooms</span>
            <span>USDC accepted</span>
          </div>

          <Button asChild className="w-full" disabled={availabilityStatus === 'booked'}>
            <Link href={`/property/${property.id}`}>
              {availabilityStatus === 'booked' ? 'Fully Booked' : 'View Details'}
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};

// Main component
export const FeaturedProperties = () => {
  const properties = getFeaturedProperties();

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
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
};
