'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Star, Users, Home, Calendar, Wallet } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Same property type from FeaturedProperties
type Property = {
  id: string;
  title: string;
  location: string;
  price: number;
  image: string;
  rating: number;
  distance: string;
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
      image: '/images/property-1.jpg',
      rating: 4.1,
      distance: '30km',
    },
    {
      id: '2',
      title: 'Luxury Villa with Pool',
      location: 'Luján, Buenos Aires',
      price: 6000,
      image: '/images/property-2.jpg',
      rating: 4.8,
      distance: '6km',
    },
    {
      id: '3',
      title: 'Cozy Bedroom Suite',
      location: 'Luján, Buenos Aires',
      price: 4500,
      image: '/images/property-3.jpg',
      rating: 3.9,
      distance: '14km',
    },
    {
      id: '4',
      title: 'Elegant Studio Apartment',
      location: 'Luján, Buenos Aires',
      price: 5600,
      image: '/images/property-4.jpg',
      rating: 4.5,
      distance: '8km',
    },
    {
      id: '5',
      title: 'Charming Kitchen Loft',
      location: 'Luján, Buenos Aires',
      price: 2100,
      image: '/images/property-5.jpg',
      rating: 4.2,
      distance: '12km',
    },
    {
      id: '6',
      title: 'Modern Architectural House',
      location: 'Luján, Buenos Aires',
      price: 6500,
      image: '/images/property-6.jpg',
      rating: 4.7,
      distance: '10km',
    },
  ];

  return mockProperties.find((property) => property.id === id) || mockProperties[0];
};

interface PropertyDetailProps {
  id: string;
}

export const PropertyDetail = ({ id }: PropertyDetailProps) => {
  // In a real app, this would use SWR or React Query with an API call
  const property = getPropertyById(id);

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
            <Image
              src={property.image}
              alt={property.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
            />
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
              <span className="font-medium">4 Guests</span>
            </div>
            <div className="bg-card p-4 rounded-lg flex flex-col items-center">
              <Home className="w-6 h-6 mb-2 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">2 Bedrooms</span>
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

          <div>
            <h2 className="text-xl font-semibold mb-4">Amenities</h2>
            <ul className="grid grid-cols-2 gap-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
                High-speed WiFi
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
                Air conditioning
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
                Fully equipped kitchen
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
                Washer & dryer
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
                Free parking
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
                Smart TV
              </li>
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
                <label className="text-sm font-medium">Check-in</label>
                <div className="flex items-center border rounded-md p-2 bg-background">
                  <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                  <input
                    type="date"
                    className="border-0 p-0 focus:outline-none w-full bg-transparent"
                    placeholder="Add date"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Check-out</label>
                <div className="flex items-center border rounded-md p-2 bg-background">
                  <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                  <input
                    type="date"
                    className="border-0 p-0 focus:outline-none w-full bg-transparent"
                    placeholder="Add date"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <label className="text-sm font-medium">Guests</label>
              <div className="flex items-center border rounded-md p-2 bg-background">
                <Users className="h-5 w-5 text-muted-foreground mr-2" />
                <select className="border-0 p-0 focus:outline-none w-full bg-transparent">
                  <option value="1">1 guest</option>
                  <option value="2">2 guests</option>
                  <option value="3">3 guests</option>
                  <option value="4">4 guests</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span>${property.price} × 5 nights</span>
                <span>${property.price * 5}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Cleaning fee</span>
                <span>$150</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Service fee</span>
                <span>$100</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                <span>Total (USDC)</span>
                <span>${property.price * 5 + 150 + 100}</span>
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
