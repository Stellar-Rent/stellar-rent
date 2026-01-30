'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Home, MapPin, Star, Users, Wallet } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import type { FullPropertyProps } from 'public/mock-data';
import { MOCK_PROPERTIES } from 'public/mock-data';
import { useEffect, useState } from 'react';

export default function PropertyDetailPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const [property, setProperty] = useState<FullPropertyProps | null>(null);

  const [imageError, setImageError] = useState(false);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
  });

  const calculateNights = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) return 0;

    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights(bookingData.checkIn, bookingData.checkOut);
  const subtotal = property ? property.price * nights : 0;
  const cleaningFee = 150;
  const serviceFee = 100;
  const total = subtotal + cleaningFee + serviceFee;

  useEffect(() => {
    if (propertyId) {
      const match = MOCK_PROPERTIES.find((p) => p.id === propertyId);
      setProperty(match || null);
    }
  }, [propertyId]);

  if (!property) {
    return (
      <div className="text-center p-8">
        <p className="text-lg">Property not found.</p>
      </div>
    );
  }

  return (
    <main className="px-4 pb-16 pt-20 max-w-6xl mx-auto text-[#182A47] dark:text-[#C2F2FF]">
      <button
        type="button"
        onClick={() => window.history.back()}
        className="text-base underline text-blue-800 dark:text-blue-400"
      >
        ← Back to Search
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        <div className="lg:col-span-2">
          <div className="relative h-[400px] w-full rounded-lg overflow-hidden">
            {!imageError ? (
              <div className="grid gap-2 sm:gap-4 grid-cols-2 sm:grid-cols-4 auto-rows-[150px] sm:auto-rows-[200px]">
                {property.images.map((img, index) => (
                  <div
                    key={`${property.id}-${index}`}
                    className={`relative overflow-hidden rounded-xl ${
                      index === 0 ? 'col-span-2 row-span-2 sm:row-span-2 sm:col-span-2' : ''
                    }`}
                  >
                    <Image
                      width={300}
                      height={300}
                      src={img}
                      alt={`${property.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <p className="text-muted-foreground">Image not available</p>
              </div>
            )}
            <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-[#0B1D39]/90 px-3 py-1 rounded-md text-sm font-medium flex items-center">
              <Star className="w-4 h-4 mr-1 text-yellow-500" /> {property.rating}
            </div>
          </div>

          <h1 className="text-3xl font-bold mt-6 mb-2">{property.title}</h1>
          <p className="text-lg text-muted-foreground flex items-center mb-6">
            <MapPin className="w-5 h-5 mr-2" /> {property.location}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card p-4 rounded-lg flex flex-col items-center">
              <Users className="w-6 h-6 mb-2 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">{property.maxGuests} Guests</span>
            </div>
            <div className="bg-card p-4 rounded-lg flex flex-col items-center">
              <Home className="w-6 h-6 mb-2 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">{property.bedrooms} Bedrooms</span>
            </div>
            <div className="bg-card p-4 rounded-lg flex flex-col items-center">
              <MapPin className="w-6 h-6 mb-2 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">{property.distance}</span>
            </div>
            <div className="bg-card p-4 rounded-lg flex flex-col items-center">
              <Wallet className="w-6 h-6 mb-2 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">USDC Payment</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">About this property</h2>
            <p className="text-muted-foreground mb-4">
              This property is located in {property.location}, providing access to local
              attractions.
            </p>
            <p className="text-muted-foreground">
              Modern amenities include high-speed WiFi and fully equipped kitchen for both short and
              long-term stays.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {property.amenities.map((amenity) => (
                <li key={amenity} className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2" />
                  {amenity}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">${property.price}</h3>
              <span className="text-muted-foreground">per night</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label htmlFor="check-in" className="text-sm font-medium">
                  Check-in
                </label>
                <div className="flex items-center border rounded-md p-2 bg-background">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <input
                    id="check-in"
                    type="date"
                    className="border-0 p-0 focus:outline-none w-full bg-transparent"
                    value={bookingData.checkIn}
                    onChange={(e) => setBookingData({ ...bookingData, checkIn: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="check-out" className="text-sm font-medium">
                  Check-out
                </label>
                <div className="flex items-center gap-2 border rounded-md p-2 bg-background">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <input
                    id="check-out"
                    type="date"
                    className="border-0 p-0 focus:outline-none w-full bg-transparent"
                    value={bookingData.checkOut}
                    onChange={(e) => setBookingData({ ...bookingData, checkOut: e.target.value })}
                    min={bookingData.checkIn}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <label htmlFor="guest-count" className="text-sm font-medium">
                Guests
              </label>
              <div className="flex items-center border rounded-md p-2 bg-background">
                <Users className="h-5 w-5 text-muted-foreground mr-2" />
                <select
                  id="guest-count"
                  className="border-0 p-0 focus:outline-none w-full bg-transparent"
                  value={bookingData.guests}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, guests: Number(e.target.value) })
                  }
                >
                  {[...Array(property.maxGuests)].map((_, i) => (
                    <option key={`guest-${i + 1}`} value={i + 1}>
                      {i + 1} {i === 0 ? 'guest' : 'guests'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span>
                  ${property.price} × {nights} nights
                </span>
                <span>${subtotal}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Cleaning fee</span>
                <span>${cleaningFee}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Service fee</span>
                <span>${serviceFee}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                <span>Total (USDC)</span>
                <span>${total}</span>
              </div>
            </div>

            <Button className="w-full bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-700 dark:hover:bg-blue-600">
              Book now with USDC
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Payment will be processed through our secure payment gateway.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
