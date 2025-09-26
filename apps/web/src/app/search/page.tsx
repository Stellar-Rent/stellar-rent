'use client';

import PropertyGrid from '@/components/search/PropertyGrid';
import type { LatLngTuple } from 'leaflet';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { searchProperties } from '~/services/propertyService';
import type { Property, PropertySearchFilters, PropertySearchOptions } from '~/types/property';
import FilterSidebar from '~/components/search/FilterSidebar';
import SearchBar from '~/components/search/SearchBar';
import { SortOptions } from '~/components/search/SortOptions';

const PropertyMap = dynamic(() => import('@/components/search/Map'), {
  ssr: false,
});

export default function SearchPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10; // match backend default
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState('price_asc');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    price: 0,
    amenities: {} as Record<string, boolean>,
    rating: 0,
  });
  const searchParams = useSearchParams();

  const center: LatLngTuple = [-34.61, -58.39];
  const markers: { position: LatLngTuple; title: string }[] = [
    { position: [-34.61, -58.39], title: 'Modern Apartment with Kitchen' },
    { position: [-34.6, -58.37], title: 'Cozy Studio Apartment' },
  ];

  // Parse location to city/country
  const parseLocation = (location: string) => {
    const parts = location.split(',').map(p => p.trim());
    const country = parts.pop() || '';
    const city = parts.pop() || '';
    return { city, country };
  };

  // Map frontend sort to backend
  const mapSortToBackend = (sort: string): { sort_by: 'price' | 'created_at' | 'title'; sort_order: 'asc' | 'desc' } => {
    switch (sort) {
      case 'price_asc':
        return { sort_by: 'price', sort_order: 'asc' };
      case 'price_desc':
        return { sort_by: 'price', sort_order: 'desc' };
      case 'newest':
        return { sort_by: 'created_at', sort_order: 'desc' };
      default:
        return { sort_by: 'created_at', sort_order: 'desc' };
    }
  };

  // Fetch properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setError(null);

      const location = searchParams.get('location') || '';
      const { city, country } = parseLocation(location);
      const checkIn = searchParams.get('checkIn');
      const checkOut = searchParams.get('checkOut');
      const guests = Number.parseInt(searchParams.get('guests') || '1');

      const apiFilters: PropertySearchFilters = {
        city: city || undefined,
        country: country || undefined,
        min_price: filters.price > 0 ? filters.price : undefined,
        max_price: undefined, // not in frontend
        max_guests: guests > 0 ? guests : undefined,
        from: checkIn || undefined,
        to: checkOut || undefined,
        amenities: Object.keys(filters.amenities).filter(k => filters.amenities[k]).join(',') || undefined,
      };

      const { sort_by, sort_order } = mapSortToBackend(sort);
      const options: PropertySearchOptions = {
        page,
        limit: pageSize,
        sort_by,
        sort_order,
      };

      const result = await searchProperties(apiFilters, options);
      if (result) {
        let props = result.properties;
        // Client-side filter for rating (not supported by backend)
        if (filters.rating > 0) {
          props = props.filter(p => (p.rating || 0) >= filters.rating);
        }
        // Client-side sort for rating/distance (not supported)
        if (sort === 'rating') {
          props.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sort === 'distance') {
          props.sort((a, b) => {
            const aDist = Number.parseFloat(a.distance || '0');
            const bDist = Number.parseFloat(b.distance || '0');
            return aDist - bDist;
          });
        }
        setProperties(props);
        setTotalPages(Math.ceil(result.total / pageSize));
      } else {
        setProperties([]);
        setTotalPages(1);
        setError('Failed to load properties');
      }
      setIsLoading(false);
    };

    fetchProperties();
  }, [searchParams, filters, sort, page]);

  const loadNextPage = useCallback(() => {
    if (page < totalPages && !isLoading) {
      setPage(prev => prev + 1);
    }
  }, [page, totalPages, isLoading]);

  const minMax = useMemo(() => {
    // For now, hardcoded or from API if available; assume 0-10000
    return [0, 10000] as [number, number];
  }, []);

  return (
    <main className="px-4 py-6 mt-10 space-y-6">
      <div className="flex flex-col lg:flex-row gap-3 md:gap-6">
        <div className="w-full lg:w-72">
          <FilterSidebar
            filters={filters}
            minAndMaxPrice={minMax}
            onFiltersChange={setFilters}
            center={center}
            markers={markers}
          />
        </div>

        <div className="flex-1">
          <div className="flex flex-col md:flex-row justify-between gap-4 items-center border md:mt-5 p-1 md:pr-4">
            <SearchBar />
            <SortOptions onSortChange={setSort} />
          </div>

          <div className="flex flex-col lg:flex-row">
            <div className="w-full">
              {error && <p className="text-center my-4 text-red-500">{error}</p>}
              {properties.length === 0 && !isLoading && !error && <p className="text-center my-4">No properties found.</p>}
              <PropertyGrid properties={properties} onLoadMore={loadNextPage} />
              {isLoading && <p className="text-center my-4">Loading more properties...</p>}
            </div>

            <div className="w-full lg:w-[40%] h-[300px] lg:h-[70vh] mt-4 lg:mt-12 rounded-2xl border m-0 lg:m-6 block">
              <PropertyMap center={center} markers={markers} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
