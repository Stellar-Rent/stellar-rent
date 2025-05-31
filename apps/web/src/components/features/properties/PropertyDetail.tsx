'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Star, Users, Home, Calendar, Wallet } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

// Extended property type with additional details
type Property = {
  id: string;
  title: string;
  location: string;
  price: number;
  image: string;
  rating: number;
  distance: string;
  maxGuests: number;
  bedrooms: number;
  amenities: string[];
};

// Mock function to simulate API call - to be replaced with actual API
const getPropertyById = (id: string): Property => {
  // This would be replaced with an actual API call
  const mockProperties = [
    {
      id: '1',
      title: 'Modern Apartment with Kitchen',
      location: 'Luján, Buenos Aires',
      price: 2500,
      image: '/images/house1.jpg',
      rating: 4.1,
      distance: '30km',
      maxGuests: 4,
      bedrooms: 2,
      amenities: ['Wi-Fi', 'Air conditioning', 'Fully equipped kitchen', 'Washer & dryer']
    },
    {
      id: '2',
      title: 'Luxury Villa with Pool',
      location: 'Luján, Buenos Aires',
      price: 6000,
      image: '/images/house2.jpg',
      rating: 4.8,
      distance: '6km',
      maxGuests: 8,
      bedrooms: 4,
      amenities: ['Pool', 'Wi-Fi', 'Air conditioning', 'Fully equipped kitchen', 'Washer & dryer']
    },
    {
      id: '3',
      title: 'Cozy Bedroom Suite',
      location: 'Luján, Buenos Aires',
      price: 4500,
      image: '/images/house3.jpg',
      rating: 3.9,
      distance: '14km',
      maxGuests: 2,
      bedrooms: 1,
      amenities: ['Wi-Fi', 'Air conditioning', 'Fully equipped kitchen']
    },
    {
      id: '4',
      title: 'Elegant Studio Apartment',
      location: 'Luján, Buenos Aires',
      price: 5600,
      image: '/images/house4.jpg',
      rating: 4.5,
      distance: '8km',
      maxGuests: 3,
      bedrooms: 1,
      amenities: ['Wi-Fi', 'Air conditioning', 'Smart TV', 'Fully equipped kitchen']
    },
    {
      id: '5',
      title: 'Charming Kitchen Loft',
      location: 'Luján, Buenos Aires',
      price: 2100,
      image: '/images/house5.jpg',
      rating: 4.2,
      distance: '12km',
      maxGuests: 2,
      bedrooms: 1,
      amenities: ['Wi-Fi', 'Fully equipped kitchen', 'Free parking']
    },
    {
      id: '6',
      title: 'Modern Architectural House',
      location: 'Luján, Buenos Aires',
      price: 6500,
      image: '/images/house.jpg',
      rating: 4.7,
      distance: '10km',
      maxGuests: 6,
      bedrooms: 3,
      amenities: ['Wi-Fi', 'Air conditioning', 'Fully equipped kitchen', 'Washer & dryer', 'Free parking', 'Smart TV']
    },
  ];

  const property = mockProperties.find((property) => property.id === id);
  if (!property) {
    throw new Error(`Property with id "${id}" not found`);
  }
  return property;
};

interface PropertyDetailProps {
  id: string;
}

export const PropertyDetail = ({ id }: PropertyDetailProps) => {
  // In a real app, this would use SWR or React Query with an API call
  let property: Property;
  try {
    property = getPropertyById(id);
  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 mb-6 hover:underline"
        >
          ← Back to properties
        </Link>
        <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-lg max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">Property Not Found</h2>
          <p className="mb-4">The property you're looking for could not be found. It may have been removed or the ID is incorrect.</p>
          <Button asChild className="mt-4">
            <Link href="/">Browse Available Properties</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
  });
  
  const calculateNights = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // Validate dates
    if (checkInDate >= checkOutDate) return 0;
    
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  };
  
  const nights = calculateNights(bookingData.checkIn, bookingData.checkOut);
  const subtotal = property.price * nights;
  const cleaningFee = 150;
  const serviceFee = 100;
  const total = subtotal + cleaningFee + serviceFee;
  
  const [imageError, setImageError] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center text-blue-600 dark:text-blue-400 mb-6 hover:underline"
      >
        ← Back to properties
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Property Images */}
        <div className="lg:col-span-2">
          <div className="relative h-[400px] w-full rounded-lg overflow-hidden">
            {!imageError ? (
              <Image
                src={property.image}
                alt={property.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
                onError={() => setImageError(true)}
              />
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
              This beautiful property offers a perfect blend of comfort and luxury. Located in the
              heart of {property.location}, it provides easy access to local attractions,
              restaurants, and transportation.
            </p>
            <p className="text-muted-foreground">
              The property features modern amenities, including high-speed WiFi, a fully equipped
              kitchen, and comfortable sleeping arrangements. Perfect for both short and long-term
              stays, this rental property accepts cryptocurrency payments for a seamless booking
              experience.
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

        {/* Booking Card */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">${property.price}</h3>
              <span className="text-muted-foreground">per night</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label htmlFor="check-in" className="text-sm font-medium">Check-in</label>
                <div className="flex items-center border rounded-md p-2 bg-background">
                  <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                  <input
                    id="check-in"
                    type="date"
                    className="border-0 p-0 focus:outline-none w-full bg-transparent"
                    placeholder="Add date"
                    value={bookingData.checkIn}
                    onChange={(e) => setBookingData({ ...bookingData, checkIn: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="check-out" className="text-sm font-medium">Check-out</label>
                <div className="flex items-center border rounded-md p-2 bg-background">
                  <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                  <input
                    id="check-out"
                    type="date"
                    className="border-0 p-0 focus:outline-none w-full bg-transparent"
                    placeholder="Add date"
                    value={bookingData.checkOut}
                    onChange={(e) => setBookingData({ ...bookingData, checkOut: e.target.value })}
                    min={bookingData.checkIn} // Prevent selecting checkout before checkin
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <label htmlFor="guest-count" className="text-sm font-medium">Guests</label>
              <div className="flex items-center border rounded-md p-2 bg-background">
                <Users className="h-5 w-5 text-muted-foreground mr-2" />
                <select 
                  id="guest-count"
                  className="border-0 p-0 focus:outline-none w-full bg-transparent"
                  value={bookingData.guests}
                  onChange={(e) => setBookingData({ ...bookingData, guests: Number(e.target.value) })}
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
                <span>${property.price} × {nights || 0} nights</span>
                <span>${subtotal || 0}</span>
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
                <span>${total || cleaningFee + serviceFee}</span>
              </div>
            </div>

            <Button className="w-full bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-700 dark:hover:bg-blue-600">
              Book now with USDC
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              You won't be charged yet. Payment will be processed through our secure crypto payment
              gateway.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
