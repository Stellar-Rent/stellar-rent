"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPropertyById } from "@/lib/data/properties";
import type { PropertyDetailProps } from "@/lib/types/property";
import {
  Car,
  ChevronDown,
  ChevronUp,
  Heart,
  Home,
  MapPin,
  Share,
  Shield,
  Star,
  Tv,
  Users,
  Utensils,
  Wallet,
  Waves,
  Wifi,
  Wind,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { PropertyCalendar } from "./PropertyCalendar";
import { PropertyImageGallery } from "./PropertyImageGallery";
import { PropertyMap } from "./PropertyMap";
import { PropertyReviewsSection } from "./PropertyReviewsSection";

export const PropertyDetail = ({ id }: PropertyDetailProps) => {
  const [selectedDates, setSelectedDates] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const property = getPropertyById(id);

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 mb-6 hover:underline"
        >
          ← Back to properties
        </Link>
        <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-lg max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">
            Property Not Found
          </h2>
          <p className="mb-4">
            The property you're looking for could not be found.
          </p>
          <Button asChild className="mt-4">
            <Link href="/">Browse Available Properties</Link>
          </Button>
        </div>
      </div>
    );
  }

  const calculateNights = () => {
    if (!selectedDates?.from || !selectedDates?.to) return 0;
    return Math.ceil(
      (selectedDates.to.getTime() - selectedDates.from.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    const subtotal = property.price * nights;
    const cleaningFee = 150;
    const serviceFee = 100;
    return {
      nights,
      subtotal,
      cleaningFee,
      serviceFee,
      total: subtotal + cleaningFee + serviceFee,
    };
  };

  const getAmenityIcon = (amenity: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      "Wi-Fi": <Wifi className="w-5 h-5" />,
      "Air conditioning": <Wind className="w-5 h-5" />,
      "Fully equipped kitchen": <Utensils className="w-5 h-5" />,
      "Free parking": <Car className="w-5 h-5" />,
      "Smart TV": <Tv className="w-5 h-5" />,
      Pool: <Waves className="w-5 h-5" />,
    };
    return iconMap[amenity] || <Shield className="w-5 h-5" />;
  };

  const costs = calculateTotal();

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 mb-6 hover:underline"
        >
          ← Back to properties
        </Link>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-medium">{property.rating}</span>
                <span>({property.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{property.location}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 lg:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigator.share?.({
                  title: property.title,
                  url: window.location.href,
                })
              }
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFavorited(!isFavorited)}
              className={isFavorited ? "text-red-500 border-red-500" : ""}
            >
              <Heart
                className={`w-4 h-4 mr-2 ${isFavorited ? "fill-red-500" : ""}`}
              />
              {isFavorited ? "Saved" : "Save"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <PropertyImageGallery
              images={property.images}
              title={property.title}
            />

            {/* Property Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <Users className="w-6 h-6 mb-2 text-blue-600 dark:text-blue-400 mx-auto" />
                <div className="font-medium">{property.maxGuests} Guests</div>
              </Card>
              <Card className="p-4 text-center">
                <Home className="w-6 h-6 mb-2 text-blue-600 dark:text-blue-400 mx-auto" />
                <div className="font-medium">{property.bedrooms} Bedrooms</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="w-6 h-6 mb-2 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                  🚿
                </div>
                <div className="font-medium">
                  {property.bathrooms} Bathrooms
                </div>
              </Card>
              <Card className="p-4 text-center">
                <Wallet className="w-6 h-6 mb-2 text-blue-600 dark:text-blue-400 mx-auto" />
                <div className="font-medium">USDC Payment</div>
              </Card>
            </div>

            {/* Description */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                About this property
              </h2>
              <div className="space-y-4">
                <p
                  className={`text-muted-foreground ${
                    !isDescriptionExpanded ? "line-clamp-3" : ""
                  }`}
                >
                  {property.description}
                </p>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setIsDescriptionExpanded(!isDescriptionExpanded)
                  }
                  className="p-0 h-auto font-medium"
                >
                  {isDescriptionExpanded ? (
                    <>
                      Show less <ChevronUp className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Show more <ChevronDown className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Amenities */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Amenities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {property.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-3">
                    <div className="text-blue-600 dark:text-blue-400">
                      {getAmenityIcon(amenity)}
                    </div>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Policies */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                House Rules & Policies
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Check-in / Check-out</h3>
                  <div className="text-muted-foreground space-y-1">
                    <p>Check-in: {property.policies.checkIn}</p>
                    <p>Check-out: {property.policies.checkOut}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Cancellation Policy</h3>
                  <p className="text-muted-foreground">
                    {property.policies.cancellation}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Security Deposit</h3>
                  <p className="text-muted-foreground">
                    ${property.policies.deposit} USDC (refundable)
                  </p>
                </div>
              </div>
            </Card>

            {/* Mobile Calendar - Show on mobile before reviews */}
            <div className="lg:hidden">
              <PropertyCalendar
                unavailableDates={property.availability.unavailableDates}
                onDateSelect={setSelectedDates}
                selectedDates={selectedDates}
                minNights={property.availability.minNights}
              />
            </div>

            {/* Map */}
            <PropertyMap
              address={property.address}
              coordinates={property.coordinates}
              neighborhoodInfo={property.neighborhoodInfo}
            />

            {/* Reviews */}
            <PropertyReviewsSection
              propertyId={property.id}
              averageRating={property.rating}
              totalReviews={property.reviewCount}
            />
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-2xl font-bold">${property.price}</span>
                  <span className="text-muted-foreground ml-1">
                    USDC per night
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                >
                  Available
                </Badge>
              </div>

              {/* Calendar - Hidden on mobile */}
              <div className="mb-6 hidden lg:block">
                <PropertyCalendar
                  unavailableDates={property.availability.unavailableDates}
                  onDateSelect={setSelectedDates}
                  selectedDates={selectedDates}
                  minNights={property.availability.minNights}
                />
              </div>

              {/* Guests */}
              <div className="mb-6">
                <label
                  htmlFor="guest-selector"
                  className="block text-sm font-medium mb-2"
                >
                  Guests
                </label>
                <div
                  id="guest-selector"
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <span>Guests</span>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      disabled={guests <= 1}
                      aria-label="Decrease number of guests"
                    >
                      -
                    </Button>
                    <span
                      className="w-8 text-center"
                      aria-live="polite"
                      aria-label={`${guests} guests selected`}
                    >
                      {guests}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setGuests(Math.min(property.maxGuests, guests + 1))
                      }
                      disabled={guests >= property.maxGuests}
                      aria-label="Increase number of guests"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              {costs.nights > 0 && (
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between">
                    <span>
                      ${property.price} × {costs.nights} nights
                    </span>
                    <span>${costs.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cleaning fee</span>
                    <span>${costs.cleaningFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service fee</span>
                    <span>${costs.serviceFee}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>${costs.total} USDC</span>
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-[#4A90E2] hover:bg-[#357ABD] text-white"
                disabled={!selectedDates?.from || !selectedDates?.to}
                asChild
              >
                <Link href="/booking">Book Now with USDC</Link>
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                You won't be charged yet. Payment will be processed securely
                through our crypto payment gateway.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
