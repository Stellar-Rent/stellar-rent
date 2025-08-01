'use client';

import {
  BuildingIcon,
  CalendarIcon,
  CastleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FilterIcon,
  HomeIcon,
  HotelIcon,
  MapIcon,
  ParkingCircleIcon,
  PawPrintIcon,
  StarIcon,
  TreePineIcon,
  UsersIcon,
  WavesIcon,
  WifiIcon,
  XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { LatLngExpression } from 'leaflet';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

interface AdvancedFilters {
  price: {
    min: number;
    max: number;
  };
  amenities: Record<string, boolean>;
  propertyType: string[];
  guests: {
    min: number;
    max: number;
  };
  bedrooms: {
    min: number;
    max: number;
  };
  bathrooms: {
    min: number;
    max: number;
  };
  rating: number;
  dates: {
    checkIn?: Date;
    checkOut?: Date;
  };
  location: {
    latitude?: number;
    longitude?: number;
    radius: number;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFilterSidebarProps {
  filters: AdvancedFilters;
  minAndMaxPrice: [number, number];
  onFiltersChange: (newFilters: AdvancedFilters) => void;
  center: LatLngExpression;
  markers: {
    position: LatLngExpression;
    title: string;
  }[];
  isLoading?: boolean;
}

const AMENITIES = [
  { name: 'Wifi', icon: <WifiIcon size={18} />, key: 'wifi' },
  { name: 'Pool', icon: <WavesIcon size={18} />, key: 'pool' },
  {
    name: 'Pet Friendly',
    icon: <PawPrintIcon size={18} />,
    key: 'pet_friendly',
  },
  { name: 'Parking', icon: <ParkingCircleIcon size={18} />, key: 'parking' },
  { name: 'Garden', icon: <TreePineIcon size={18} />, key: 'garden' },
  { name: 'Kitchen', icon: <BuildingIcon size={18} />, key: 'kitchen' },
  {
    name: 'Air Conditioning',
    icon: <WifiIcon size={18} />,
    key: 'air_conditioning',
  },
  { name: 'Heating', icon: <WifiIcon size={18} />, key: 'heating' },
  { name: 'TV', icon: <WifiIcon size={18} />, key: 'tv' },
  { name: 'Gym', icon: <WifiIcon size={18} />, key: 'gym' },
  { name: 'Balcony', icon: <WifiIcon size={18} />, key: 'balcony' },
  { name: 'Fireplace', icon: <WifiIcon size={18} />, key: 'fireplace' },
  { name: 'Hot Tub', icon: <WifiIcon size={18} />, key: 'hot_tub' },
  { name: 'BBQ', icon: <WifiIcon size={18} />, key: 'bbq' },
  { name: 'Dishwasher', icon: <WifiIcon size={18} />, key: 'dishwasher' },
  { name: 'Microwave', icon: <WifiIcon size={18} />, key: 'microwave' },
  {
    name: 'Coffee Machine',
    icon: <WifiIcon size={18} />,
    key: 'coffee_machine',
  },
  { name: 'Iron', icon: <WifiIcon size={18} />, key: 'iron' },
  { name: 'Hair Dryer', icon: <WifiIcon size={18} />, key: 'hair_dryer' },
  { name: 'Towels', icon: <WifiIcon size={18} />, key: 'towels' },
  { name: 'Bed Linen', icon: <WifiIcon size={18} />, key: 'bed_linen' },
  { name: 'Soap', icon: <WifiIcon size={18} />, key: 'soap' },
  { name: 'Toilet Paper', icon: <WifiIcon size={18} />, key: 'toilet_paper' },
  { name: 'Shampoo', icon: <WifiIcon size={18} />, key: 'shampoo' },
  { name: 'First Aid Kit', icon: <WifiIcon size={18} />, key: 'first_aid_kit' },
  {
    name: 'Fire Extinguisher',
    icon: <WifiIcon size={18} />,
    key: 'fire_extinguisher',
  },
  { name: 'Smoke Alarm', icon: <WifiIcon size={18} />, key: 'smoke_alarm' },
  {
    name: 'Carbon Monoxide Alarm',
    icon: <WifiIcon size={18} />,
    key: 'carbon_monoxide_alarm',
  },
];

const PROPERTY_TYPES = [
  { name: 'Apartment', icon: <BuildingIcon size={18} />, key: 'apartment' },
  { name: 'House', icon: <HomeIcon size={18} />, key: 'house' },
  { name: 'Villa', icon: <CastleIcon size={18} />, key: 'villa' },
  { name: 'Studio', icon: <BuildingIcon size={18} />, key: 'studio' },
  { name: 'Loft', icon: <BuildingIcon size={18} />, key: 'loft' },
];

const SORT_OPTIONS = [
  { name: 'Relevance', value: 'relevance' },
  { name: 'Price: Low to High', value: 'price_asc' },
  { name: 'Price: High to Low', value: 'price_desc' },
  { name: 'Newest First', value: 'newest' },
  { name: 'Rating', value: 'rating' },
  { name: 'Distance', value: 'distance' },
];

const PropertyMap = dynamic(() => import('@/components/search/Map'), {
  ssr: false,
});

export default function AdvancedFilterSidebar({
  filters,
  minAndMaxPrice,
  onFiltersChange,
  center,
  markers,
  isLoading = false,
}: AdvancedFilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
    amenities: false,
    propertyType: false,
    capacity: false,
    dates: false,
    location: false,
    sort: false,
  });

  // Debounced filter update
  const timeoutRef = useRef<NodeJS.Timeout>();
  const debouncedUpdate = useCallback(
    (newFilters: AdvancedFilters) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onFiltersChange(newFilters);
      }, 300);
    },
    [onFiltersChange]
  );

  useEffect(() => {
    debouncedUpdate(localFilters);
  }, [localFilters, debouncedUpdate]);

  const updateFilter = (key: keyof AdvancedFilters, value: unknown) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const clearAllFilters = () => {
    const defaultFilters: AdvancedFilters = {
      price: { min: minAndMaxPrice[0], max: minAndMaxPrice[1] },
      amenities: {},
      propertyType: [],
      guests: { min: 1, max: 10 },
      bedrooms: { min: 1, max: 5 },
      bathrooms: { min: 1, max: 5 },
      rating: 0,
      dates: {},
      location: { radius: 50 },
      sortBy: 'relevance',
      sortOrder: 'desc',
    };
    setLocalFilters(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (
      localFilters.price.min !== minAndMaxPrice[0] ||
      localFilters.price.max !== minAndMaxPrice[1]
    )
      count++;
    if (Object.values(localFilters.amenities).some(Boolean)) count++;
    if (localFilters.propertyType.length > 0) count++;
    if (localFilters.guests.min !== 1 || localFilters.guests.max !== 10) count++;
    if (localFilters.bedrooms.min !== 1 || localFilters.bedrooms.max !== 5) count++;
    if (localFilters.bathrooms.min !== 1 || localFilters.bathrooms.max !== 5) count++;
    if (localFilters.rating > 0) count++;
    if (localFilters.dates.checkIn || localFilters.dates.checkOut) count++;
    if (localFilters.sortBy !== 'relevance') count++;
    return count;
  };

  return (
    <aside className="p-4 rounded-xl shadow-md text-[#182A47] dark:text-[#C2F2FF] bg-background dark:bg-input/30 mt-4 space-y-4 w-full sm:flex sm:flex-wrap sm:justify-around md:block md:w-80 md:fixed md:h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FilterIcon size={20} />
          <h3 className="font-semibold text-lg">Filters</h3>
          {getActiveFiltersCount() > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {getActiveFiltersCount()}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={clearAllFilters}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Clear all
        </button>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full text-left font-medium"
        >
          <span>Price Range</span>
          {expandedSections.price ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
        </button>
        {expandedSections.price && (
          <div className="space-y-3 pl-2">
            <div className="flex items-center justify-between text-sm">
              <span>${localFilters.price.min}</span>
              <span>${localFilters.price.max}</span>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min={minAndMaxPrice[0]}
                max={minAndMaxPrice[1]}
                step={10}
                value={localFilters.price.min}
                onChange={(e) =>
                  updateFilter('price', {
                    ...localFilters.price,
                    min: Number(e.target.value),
                  })
                }
                className="w-full accent-blue-600"
              />
              <input
                type="range"
                min={minAndMaxPrice[0]}
                max={minAndMaxPrice[1]}
                step={10}
                value={localFilters.price.max}
                onChange={(e) =>
                  updateFilter('price', {
                    ...localFilters.price,
                    max: Number(e.target.value),
                  })
                }
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Property Type */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => toggleSection('propertyType')}
          className="flex items-center justify-between w-full text-left font-medium"
        >
          <span>Property Type</span>
          {expandedSections.propertyType ? (
            <ChevronUpIcon size={16} />
          ) : (
            <ChevronDownIcon size={16} />
          )}
        </button>
        {expandedSections.propertyType && (
          <div className="grid grid-cols-1 gap-2 pl-2">
            {PROPERTY_TYPES.map(({ name, icon, key }) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.propertyType.includes(key)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...localFilters.propertyType, key]
                      : localFilters.propertyType.filter((t) => t !== key);
                    updateFilter('propertyType', newTypes);
                  }}
                />
                <span className="hidden sm:inline">{name}</span>
                <span className="sm:hidden">{icon}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Amenities */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => toggleSection('amenities')}
          className="flex items-center justify-between w-full text-left font-medium"
        >
          <span>Amenities</span>
          {expandedSections.amenities ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
        </button>
        {expandedSections.amenities && (
          <div className="grid grid-cols-2 gap-2 pl-2 max-h-60 overflow-y-auto">
            {AMENITIES.map(({ name, icon, key }) => (
              <label key={key} className="flex items-center gap-1 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!localFilters.amenities[key]}
                  onChange={(e) =>
                    updateFilter('amenities', {
                      ...localFilters.amenities,
                      [key]: e.target.checked,
                    })
                  }
                />
                <span className="hidden sm:inline">{name}</span>
                <span className="sm:hidden">{icon}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Capacity */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => toggleSection('capacity')}
          className="flex items-center justify-between w-full text-left font-medium"
        >
          <span>Capacity</span>
          {expandedSections.capacity ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
        </button>
        {expandedSections.capacity && (
          <div className="space-y-4 pl-2">
            {/* Guests */}
            <div className="space-y-2">
              <label htmlFor="guests-min" className="text-sm font-medium">
                Guests
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="guests-min"
                  type="number"
                  min="1"
                  max="20"
                  value={localFilters.guests.min}
                  onChange={(e) =>
                    updateFilter('guests', {
                      ...localFilters.guests,
                      min: Number(e.target.value),
                    })
                  }
                  className="w-16 p-1 text-sm border rounded"
                />
                <span>-</span>
                <input
                  id="guests-max"
                  type="number"
                  min="1"
                  max="20"
                  value={localFilters.guests.max}
                  onChange={(e) =>
                    updateFilter('guests', {
                      ...localFilters.guests,
                      max: Number(e.target.value),
                    })
                  }
                  className="w-16 p-1 text-sm border rounded"
                />
              </div>
            </div>

            {/* Bedrooms */}
            <div className="space-y-2">
              <label htmlFor="bedrooms-min" className="text-sm font-medium">
                Bedrooms
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="bedrooms-min"
                  type="number"
                  min="1"
                  max="10"
                  value={localFilters.bedrooms.min}
                  onChange={(e) =>
                    updateFilter('bedrooms', {
                      ...localFilters.bedrooms,
                      min: Number(e.target.value),
                    })
                  }
                  className="w-16 p-1 text-sm border rounded"
                />
                <span>-</span>
                <input
                  id="bedrooms-max"
                  type="number"
                  min="1"
                  max="10"
                  value={localFilters.bedrooms.max}
                  onChange={(e) =>
                    updateFilter('bedrooms', {
                      ...localFilters.bedrooms,
                      max: Number(e.target.value),
                    })
                  }
                  className="w-16 p-1 text-sm border rounded"
                />
              </div>
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
              <label htmlFor="bathrooms-min" className="text-sm font-medium">
                Bathrooms
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="bathrooms-min"
                  type="number"
                  min="1"
                  max="10"
                  value={localFilters.bathrooms.min}
                  onChange={(e) =>
                    updateFilter('bathrooms', {
                      ...localFilters.bathrooms,
                      min: Number(e.target.value),
                    })
                  }
                  className="w-16 p-1 text-sm border rounded"
                />
                <span>-</span>
                <input
                  id="bathrooms-max"
                  type="number"
                  min="1"
                  max="10"
                  value={localFilters.bathrooms.max}
                  onChange={(e) =>
                    updateFilter('bathrooms', {
                      ...localFilters.bathrooms,
                      max: Number(e.target.value),
                    })
                  }
                  className="w-16 p-1 text-sm border rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">Minimum Rating</span>
          <div className="flex items-center gap-1">
            <StarIcon size={16} className="text-yellow-400" />
            <span className="text-sm">{localFilters.rating}+</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={localFilters.rating}
            onChange={(e) => updateFilter('rating', Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>
      </div>

      {/* Sort Options */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => toggleSection('sort')}
          className="flex items-center justify-between w-full text-left font-medium"
        >
          <span>Sort By</span>
          {expandedSections.sort ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
        </button>
        {expandedSections.sort && (
          <div className="space-y-2 pl-2">
            {SORT_OPTIONS.map(({ name, value }) => (
              <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="sortBy"
                  value={value}
                  checked={localFilters.sortBy === value}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                />
                {name}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* View Map button (Mobile only) */}
      <div className="block md:hidden w-full mt-4">
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              <MapIcon size={18} />
              View Map
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw]">
            <DialogHeader>
              <DialogTitle className="text-center mb-2">Property Map</DialogTitle>
            </DialogHeader>
            <div className="w-full h-[80vh] rounded-2xl border">
              <PropertyMap center={center} markers={markers} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          <span className="ml-2 text-sm text-gray-600">Updating results...</span>
        </div>
      )}
    </aside>
  );
}
