'use client';

import { Button } from '@/components/ui/button';
import { Info, MapPin, Shield, Star } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

// Mock data for demonstration - Replace with API call in production
const PROPERTIES = [
  {
    id: '1',
    title: 'Modern Apartment with Sea View',
    location: 'Barcelona, Spain',
    price: 120,
    rating: 4.8,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80',
    description:
      'A beautiful modern apartment located in the heart of the city with stunning Mediterranean views.',
  },
];

const PropertySearchPage = () => {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('id');
  const [nights, setNights] = useState(0);

  const property = useMemo(
    () => PROPERTIES.find((p) => p.id === propertyId) || PROPERTIES[0],
    [propertyId]
  );

  // Logic suggested by CodeRabbitAI: Guard totals until dates are selected
  const hasDates = nights > 0;
  const subtotal = property ? property.price * nights : 0;
  const cleaningFee = hasDates ? 150 : 0;
  const serviceFee = hasDates ? 100 : 0;
  const total = subtotal + cleaningFee + serviceFee;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Property Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative h-[400px] w-full overflow-hidden rounded-xl">
            <Image
              src={property.image}
              alt={property.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold">{property.title}</h1>
                <div className="flex items-center gap-2 mt-2 text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{property.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-lg">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{property.rating}</span>
                <span className="text-gray-400">({property.reviews})</span>
              </div>
            </div>

            <p className="text-gray-300 leading-relaxed">{property.description}</p>
          </div>
        </div>

        {/* Right Column: Booking Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-secondary rounded-2xl p-6 border border-gray-800 shadow-xl">
            <div className="flex justify-between items-end mb-6">
              <div>
                <span className="text-2xl font-bold">{property.price} USDC</span>
                <span className="text-gray-400"> / night</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 gap-2">
                <label className="text-sm font-medium text-gray-400">Nights to stay</label>
                <input
                  type="number"
                  min="0"
                  value={nights}
                  onChange={(e) => setNights(Number.parseInt(e.target.value) || 0)}
                  className="w-full bg-background border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {hasDates ? (
              <div className="space-y-4 border-t border-gray-800 pt-4">
                <div className="flex justify-between text-gray-300">
                  <span>
                    {property.price} USDC x {nights} nights
                  </span>
                  <span>{subtotal} USDC</span>
                </div>
                <div className="flex justify-between text-gray-400 text-sm">
                  <span className="flex items-center gap-1">
                    Cleaning fee <Info className="h-3 w-3" />
                  </span>
                  <span>{cleaningFee} USDC</span>
                </div>
                <div className="flex justify-between text-gray-400 text-sm">
                  <span className="flex items-center gap-1">
                    Service fee <Info className="h-3 w-3" />
                  </span>
                  <span>{serviceFee} USDC</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-800">
                  <span>Total</span>
                  <span>{total} USDC</span>
                </div>
              </div>
            ) : (
              <div className="bg-background/50 rounded-lg p-4 text-center border border-dashed border-gray-700">
                <p className="text-sm text-gray-400">
                  Enter the number of nights to see the total price breakdown.
                </p>
              </div>
            )}

            <Button className="w-full mt-6 py-6 text-lg font-bold" disabled={!hasDates}>
              Reserve Now
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
              <Shield className="h-3 w-3" />
              <span>Secure transaction via Stellar Network</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertySearchPage;
