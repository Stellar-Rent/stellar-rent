'use client';

import {
  Car,
  Coffee,
  Dumbbell,
  Flame,
  MapIcon,
  PawPrint,
  Shield,
  SlidersHorizontal,
  Snowflake,
  TreePine,
  Tv,
  Utensils,
  Waves,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { SearchFilters } from '@/hooks/useSearch';

const PropertyMap = dynamic(() => import('@/components/search/Map'), {
  ssr: false,
});

interface AdvancedFilterSidebarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  center: [number, number];
  markers: Array<{
    position: [number, number];
    title: string;
    propertyId: string;
    price: number;
  }>;
  className?: string;
}

const AMENITIES = [
  { name: 'wifi', icon: Wifi, label: 'WiFi' },
  { name: 'kitchen', icon: Utensils, label: 'Kitchen' },
  { name: 'parking', icon: Car, label: 'Parking' },
  { name: 'pool', icon: Waves, label: 'Pool' },
  { name: 'garden', icon: TreePine, label: 'Garden' },
  { name: 'tv', icon: Tv, label: 'TV' },
  { name: 'gym', icon: Dumbbell, label: 'Gym' },
  { name: 'coffee_machine', icon: Coffee, label: 'Coffee Machine' },
  { name: 'pet_friendly', icon: PawPrint, label: 'Pet Friendly' },
  { name: 'air_conditioning', icon: Snowflake, label: 'AC' },
  { name: 'heating', icon: Flame, label: 'Heating' },
  { name: 'security', icon: Shield, label: 'Security' },
  { name: 'fast_wifi', icon: Zap, label: 'Fast WiFi' },
];

const PROPERTY_TYPES = [
  'apartment',
  'house',
  'studio',
  'loft',
  'villa',
  'cabin',
  'condo',
  'townhouse',
];

export default function AdvancedFilterSidebar({
  filters,
  onFiltersChange,
  center,
  markers,
  className = '',
}: AdvancedFilterSidebarProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.min_price || 50,
    filters.max_price || 500,
  ]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(filters.amenities || []);

  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value);
    onFiltersChange({
      min_price: value[0],
      max_price: value[1],
    });
  };

  const handleAmenityToggle = (amenity: string) => {
    const newAmenities = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((a) => a !== amenity)
      : [...selectedAmenities, amenity];

    setSelectedAmenities(newAmenities);
    onFiltersChange({ amenities: newAmenities });
  };

  const clearAllFilters = () => {
    setPriceRange([50, 500]);
    setSelectedAmenities([]);
    onFiltersChange({
      min_price: undefined,
      max_price: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      max_guests: undefined,
      amenities: undefined,
      property_type: undefined,
      instant_book: undefined,
      free_cancellation: undefined,
      latitude: undefined,
      longitude: undefined,
      radius: undefined,
    });
  };

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== null && value !== ''
  ).length;

  const MobileFilterDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="md:hidden relative">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search Filters</DialogTitle>
        </DialogHeader>
        <FilterContent />
      </DialogContent>
    </Dialog>
  );

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="pb-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Active Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-red-600 hover:text-red-700"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.min_price && filters.max_price && (
              <Badge variant="secondary" className="text-xs">
                ${filters.min_price} - ${filters.max_price}
              </Badge>
            )}
            {filters.bedrooms && (
              <Badge variant="secondary" className="text-xs">
                {filters.bedrooms}+ beds
              </Badge>
            )}
            {filters.max_guests && (
              <Badge variant="secondary" className="text-xs">
                {filters.max_guests}+ guests
              </Badge>
            )}
            {selectedAmenities.map((amenity) => (
              <Badge key={amenity} variant="secondary" className="text-xs">
                {AMENITIES.find((a) => a.name === amenity)?.label || amenity}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => handleAmenityToggle(amenity)}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Accordion type="multiple" defaultValue={['price', 'rooms', 'amenities']} className="w-full">
        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium">Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="px-2">
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceChange}
                  max={1000}
                  min={0}
                  step={25}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="min-price" className="text-xs">
                    Min Price
                  </Label>
                  <Input
                    id="min-price"
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => handlePriceChange([Number(e.target.value), priceRange[1]])}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="max-price" className="text-xs">
                    Max Price
                  </Label>
                  <Input
                    id="max-price"
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => handlePriceChange([priceRange[0], Number(e.target.value)])}
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Rooms & Guests */}
        <AccordionItem value="rooms">
          <AccordionTrigger className="text-sm font-medium">Rooms & Guests</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms" className="text-xs">
                    Bedrooms
                  </Label>
                  <Select
                    value={filters.bedrooms?.toString()}
                    onValueChange={(value) =>
                      onFiltersChange({ bedrooms: value === 'any' ? undefined : Number(value) })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}+
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bathrooms" className="text-xs">
                    Bathrooms
                  </Label>
                  <Select
                    value={filters.bathrooms?.toString()}
                    onValueChange={(value) =>
                      onFiltersChange({ bathrooms: value === 'any' ? undefined : Number(value) })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}+
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="guests" className="text-xs">
                  Max Guests
                </Label>
                <Select
                  value={filters.max_guests?.toString()}
                  onValueChange={(value) =>
                    onFiltersChange({ max_guests: value === 'any' ? undefined : Number(value) })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}+ guests
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Property Type */}
        <AccordionItem value="type">
          <AccordionTrigger className="text-sm font-medium">Property Type</AccordionTrigger>
          <AccordionContent>
            <Select
              value={filters.property_type}
              onValueChange={(value) =>
                onFiltersChange({ property_type: value === 'any' ? undefined : value })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Any type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any type</SelectItem>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>

        {/* Amenities */}
        <AccordionItem value="amenities">
          <AccordionTrigger className="text-sm font-medium">Amenities</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-3">
              {AMENITIES.map(({ name, icon: Icon, label }) => (
                <div key={name} className="flex items-center space-x-2">
                  <Checkbox
                    id={name}
                    checked={selectedAmenities.includes(name)}
                    onCheckedChange={() => handleAmenityToggle(name)}
                  />
                  <label
                    htmlFor={name}
                    className="flex items-center space-x-2 text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    <Icon className="h-3 w-3" />
                    <span>{label}</span>
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Special Features */}
        <AccordionItem value="features">
          <AccordionTrigger className="text-sm font-medium">Special Features</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="instant-book"
                  checked={filters.instant_book || false}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ instant_book: checked ? true : undefined })
                  }
                />
                <label htmlFor="instant-book" className="text-xs font-medium cursor-pointer">
                  Instant Book
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="free-cancellation"
                  checked={filters.free_cancellation || false}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ free_cancellation: checked ? true : undefined })
                  }
                />
                <label htmlFor="free-cancellation" className="text-xs font-medium cursor-pointer">
                  Free Cancellation
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Map Toggle for Mobile */}
      <div className="md:hidden">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <MapIcon className="h-4 w-4 mr-2" />
              View Map
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] h-[85vh]">
            <DialogHeader>
              <DialogTitle>Property Map</DialogTitle>
            </DialogHeader>
            <div className="h-full rounded-lg overflow-hidden">
              <PropertyMap center={center} markers={markers} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="md:hidden mb-4">
        <MobileFilterDialog />
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 ${className}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Filters</h2>
          {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount} active</Badge>}
        </div>
        <FilterContent />
      </aside>
    </>
  );
}
