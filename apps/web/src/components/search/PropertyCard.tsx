'use client';

import { MapPin, Square, Star, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import type { FullPropertyProps } from 'public/mock-data';

interface PropertyCardProps {
  property: FullPropertyProps;
}

export const PropertyCard = ({ property }: PropertyCardProps) => {
  return (
    <div className="bg-secondary rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden">
        <Image
          src={property.images[0] || '/images/house1.webp'}
          alt={property.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover rounded-2xl"
          priority={false}
        />
        <div className="absolute top-3 right-3 bg-green-500/60 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
          <Star className="w-3.5 h-3.5 text-[#1cf0a8]" />
          Verificado
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title and Address */}
        <h3 className="text-white font-bold text-lg mb-2 leading-tight">{property.title}</h3>
        <p className="text-gray-400 text-sm mb-4 leading-relaxed">{property.location}</p>

        {/* Property Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="flex items-center text-gray-400 text-sm">
            <Users className="w-4 h-4 mr-2 text-gray-500" />
            <span>Max {property.maxGuests} people</span>
          </div>
          <div className="flex items-center text-gray-400 text-sm">
            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
            <span>{property.distance}</span>
          </div>
          <div className="flex items-center text-gray-400 text-sm">
            <Star className="w-4 h-4 mr-2 text-[#1cf0a8]" />
            <span>{property.rating} (100+)</span>
          </div>
          <div className="flex items-center text-gray-400 text-sm">
            <Square className="w-4 h-4 mr-2 text-gray-500" />
            <span>{property.bedrooms} Bedrooms</span>
          </div>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between bg-primary/5 rounded-full px-2">
          <div className="text-white font-bold text-sm ml-10">
            ${property.price.toLocaleString()} USD / night
          </div>
          <Link href={`/property/${property.id}`}>
            <button
              type="button"
              aria-label="Open property"
              className="bg-primary/90 rounded-full p-2 border text-black flex items-center justify-center"
            >
              <Image src="/icons/homepage-arrow.webp" alt="open" width={16} height={16} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
