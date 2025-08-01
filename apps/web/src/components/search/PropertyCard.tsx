'use client';

import { ArrowRight, MapPin, Square, Star, Users } from 'lucide-react';
import Link from 'next/link';

interface Property {
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

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard = ({ property }: PropertyCardProps) => {
  return (
    <div className="bg-secondary rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover rounded-2xl"
        />
        {property.verified && (
          <div className="absolute top-3 right-3 bg-green-500/50 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
            <Star className="w-3.5 h-3.5" />
            Verificado
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title and Address */}
        <h3 className="text-white font-bold text-lg mb-2 leading-tight">{property.title}</h3>
        <p className="text-gray-400 text-sm mb-4 leading-relaxed">{property.address}</p>

        {/* Property Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="flex items-center text-gray-400 text-sm">
            <Users className="w-4 h-4 mr-2 text-gray-500" />
            <span>Max {property.maxPeople} people</span>
          </div>
          <div className="flex items-center text-gray-400 text-sm">
            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
            <span>{property.distance} km</span>
          </div>
          <div className="flex items-center text-gray-400 text-sm">
            <Star className="w-4 h-4 mr-2 text-yellow-400" />
            <span>
              {property.rating} ({property.reviews})
            </span>
          </div>
          <div className="flex items-center text-gray-400 text-sm">
            <Square className="w-4 h-4 mr-2 text-gray-500" />
            <span>{property.area} m²</span>
          </div>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between bg-primary/5 rounded-full px-2">
          <div className="text-white font-bold text-sm ml-10">
            ${property.price.toLocaleString()} {property.currency} {property.period}
          </div>
          <Link href={`/property/${property.id}`}>
            <button type="button" className="bg-primary rounded-full p-2 border text-black">
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
