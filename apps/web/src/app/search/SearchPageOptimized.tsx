'use client';

import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import FilterSidebar from '@/components/search/FilterSidebar';
import { PropertyGrid } from '@/components/search/PropertyGrid';
import SearchBar from '@/components/search/SearchBar';
import { SortOptions } from '@/components/search/SortOptions';
import { Button } from '@/components/ui/button';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { type SearchFilters, type SearchOptions, useSearch } from '@/hooks/useSearch';

const PropertyMap = dynamic(() => import('@/components/search/Map'), {
  ssr: false,
});

interface OptimizedSearchPageProps {
  initialFilters?: SearchFilters;
  initialOptions?: SearchOptions;
}

export default function OptimizedSearchPage({
  initialFilters = {},
  initialOptions = {},
}: OptimizedSearchPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showMap, setShowMap] = useState(false);

  // Parse URL parameters into filters and options
  const filtersFromURL: SearchFilters = {
    city: searchParams.get('city') || undefined,
    country: searchParams.get('country') || undefined,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
    bathrooms: searchParams.get('bathrooms') ? Number(searchParams.get('bathrooms')) : undefined,
    max_guests: searchParams.get('max_guests') ? Number(searchParams.get('max_guests')) : undefined,
    amenities: searchParams.get('amenities')?.split(',').filter(Boolean) || undefined,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    search_text: searchParams.get('search_text') || undefined,
    latitude: searchParams.get('latitude') ? Number(searchParams.get('latitude')) : undefined,
    longitude: searchParams.get('longitude') ? Number(searchParams.get('longitude')) : undefined,
    radius: searchParams.get('radius') ? Number(searchParams.get('radius')) : undefined,
    ...initialFilters,
  };

  const optionsFromURL: SearchOptions = {
    sort_by: (searchParams.get('sort_by') as any) || 'created_at',
    sort_order: (searchParams.get('sort_order') as any) || 'desc',
    limit: 20,
    ...initialOptions,
  };

  const {
    properties,
    total,
    hasMore,
    loading,
    error,
    filters,
    options,
    setFilters,
    setOptions,
    search,
    loadMore,
    reset,
  } = useSearch(filtersFromURL, optionsFromURL);

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
  });

  // Update URL when filters or options change
  useEffect(() => {
    const params = new URLSearchParams();

    // Add filters to URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(','));
          }
        } else {
          params.set(key, String(value));
        }
      }
    });

    // Add options to URL
    if (options.sort_by !== 'created_at') {
      params.set('sort_by', options.sort_by!);
    }
    if (options.sort_order !== 'desc') {
      params.set('sort_order', options.sort_order!);
    }

    const newURL = `/search${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newURL, { scroll: false });
  }, [filters, options, router]);

  // Trigger load more when intersection observer fires
  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      loadMore();
    }
  }, [isIntersecting, hasMore, loading, loadMore]);

  const handleFilterChange = useCallback(
    (newFilters: Partial<SearchFilters>) => {
      setFilters(newFilters);
      reset();
    },
    [setFilters, reset]
  );

  const handleSortChange = useCallback(
    (sortValue: string) => {
      const [sort_by, sort_order] = sortValue.split('_');
      setOptions({ sort_by: sort_by as any, sort_order: sort_order as any });
      reset();
    },
    [setOptions, reset]
  );

  const handleRetry = useCallback(() => {
    search();
  }, [search]);

  // Convert properties to map markers
  const mapMarkers = properties
    .filter((property) => property.location.coordinates)
    .map((property) => ({
      position: [
        property.location.coordinates?.latitude,
        property.location.coordinates?.longitude,
      ] as [number, number],
      title: property.title,
      propertyId: property.id,
      price: property.price,
    }));

  const mapCenter: [number, number] =
    filters.latitude && filters.longitude
      ? [filters.latitude, filters.longitude]
      : [-34.61, -58.39]; // Default to Buenos Aires

  const _currentSortValue = `${options.sort_by}_${options.sort_order}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Search Bar */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <SearchBar />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {total > 0 ? `${total} Properties Found` : 'Search Properties'}
            </h1>
            {loading && properties.length === 0 && (
              <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
            )}
          </div>

          <div className="flex items-center gap-4">
            <SortOptions onSortChange={handleSortChange} />
            <Button
              variant="outline"
              onClick={() => setShowMap(!showMap)}
              className="hidden md:flex"
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <FilterSidebar
              filters={{
                price: filters.min_price || 0,
                amenities: {},
                rating: 0,
              }}
              minAndMaxPrice={[50, 500]}
              onFiltersChange={(newFilters) => {
                handleFilterChange({
                  min_price: newFilters.price,
                  max_price: newFilters.price,
                });
              }}
              center={mapCenter}
              markers={mapMarkers.map((m) => ({ position: m.position, title: m.title }))}
            />
          </div>

          {/* Results Area */}
          <div className={`lg:col-span-${showMap ? '2' : '3'}`}>
            {properties.length === 0 && !loading && !error && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  No properties found matching your criteria.
                </p>
                <p className="text-gray-400 dark:text-gray-500 mt-2">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            )}

            {properties.length > 0 && (
              <>
                <PropertyGrid />

                {/* Load More Trigger */}
                {hasMore && (
                  <div ref={loadMoreRef} className="mt-8 flex justify-center">
                    {loading ? (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Loader2 className="animate-spin h-5 w-5" />
                        <span>Loading more properties...</span>
                      </div>
                    ) : (
                      <Button onClick={loadMore} variant="outline" className="px-8">
                        Load More Properties
                      </Button>
                    )}
                  </div>
                )}

                {!hasMore && properties.length > 0 && (
                  <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
                    You've seen all {total} properties
                  </div>
                )}
              </>
            )}
          </div>

          {/* Map */}
          {showMap && (
            <div className="lg:col-span-1">
              <div className="sticky top-6 h-[600px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <PropertyMap center={mapCenter} markers={mapMarkers} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
