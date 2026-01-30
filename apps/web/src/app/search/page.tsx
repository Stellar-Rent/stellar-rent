'use client';

import PropertyGrid from '@/components/search/PropertyGrid';
import type { LatLngTuple } from 'leaflet';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { MOCK_PROPERTIES } from 'public/mock-data';
import { useCallback, useMemo, useState } from 'react';
import FilterSidebar from '~/components/search/FilterSidebar';
import SearchBar from '~/components/search/SearchBar';
import { SortOptions } from '~/components/search/SortOptions';

const PropertyMap = dynamic(() => import('@/components/search/Map'), {
  ssr: false,
});

export default function SearchPage() {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 3;
  const [sortOrder, setSortOrder] = useState('price_asc');
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    price: 0,
    amenities: {} as Record<string, boolean>,
    rating: 0,
  });
  const searchParams = useSearchParams();

  const mapCenter: LatLngTuple = [-34.61, -58.39];
  const mapMarkers: { position: LatLngTuple; title: string }[] = [
    { position: [-34.61, -58.39], title: 'Modern Apartment with Kitchen' },
    { position: [-34.6, -58.37], title: 'Cozy Studio Apartment' },
  ];

  const filteredSortedProperties = useMemo(() => {
    let result = [...MOCK_PROPERTIES];

    const locationQuery = searchParams.get('location')?.toLowerCase() || '';
    if (locationQuery) {
      result = result.filter((p) => p.location.toLowerCase().includes(locationQuery));
    }

    result = result.filter((p) => p.price >= filters.price);

    const selectedAmenities = Object.entries(filters.amenities)
      .filter(([, isChecked]) => isChecked)
      .map(([key]) => key.toLowerCase());

    if (selectedAmenities.length > 0) {
      result = result.filter((p) =>
        selectedAmenities.every((am) => p.amenities.map((a) => a.toLowerCase()).includes(am))
      );
    }

    if (filters.rating > 0) {
      result = result.filter((p) => p.rating >= filters.rating);
    }

    if (sortOrder === 'price_asc') result.sort((a, b) => a.price - b.price);
    if (sortOrder === 'price_desc') result.sort((a, b) => b.price - a.price);
    if (sortOrder === 'rating') result.sort((a, b) => b.rating - a.rating);
    if (sortOrder === 'distance') {
      result.sort((a, b) => {
        const distA = Number.parseFloat(a.distance);
        const distB = Number.parseFloat(b.distance);
        return distA - distB;
      });
    }

    return result;
  }, [filters, sortOrder, searchParams]);

  const visibleProperties = useMemo(() => {
    return filteredSortedProperties.slice(0, page * PAGE_SIZE);
  }, [filteredSortedProperties, page]);

  const loadNextPage = useCallback(() => {
    if (isLoading) return;
    setIsLoading(true);
    // Simulate async loading
    setTimeout(() => {
      setPage((prev) => prev + 1);
      setIsLoading(false);
    }, 200);
  }, [isLoading]);

  const priceRange = useMemo(() => {
    const sorted = [...MOCK_PROPERTIES].sort((a, b) => a.price - b.price);
    return [sorted[0]?.price || 0, sorted.at(-1)?.price || 0] as [number, number];
  }, []);

  return (
    <main className="px-4 py-6 mt-10 space-y-6">
      <div className="flex flex-col lg:flex-row gap-3 md:gap-6">
        <div className="w-full lg:w-72">
          <FilterSidebar
            filters={filters}
            minAndMaxPrice={priceRange}
            onFiltersChange={setFilters}
            center={mapCenter}
            markers={mapMarkers}
          />
        </div>

        <div className="flex-1">
          <div className="flex flex-col md:flex-row justify-between gap-4 items-center border md:mt-5 p-1 md:pr-4">
            <SearchBar />
            <SortOptions onSortChange={setSortOrder} />
          </div>

          <div className="flex flex-col lg:flex-row">
            <div className="w-full">
              <PropertyGrid properties={visibleProperties} onLoadMore={loadNextPage} />
              {isLoading && <p className="text-center my-4">Loading more properties...</p>}
            </div>

            <div className="w-full lg:w-[40%] h-[300px] lg:h-[70vh] mt-4 lg:mt-12 rounded-2xl border m-0 lg:m-6 block">
              <PropertyMap center={mapCenter} markers={mapMarkers} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
