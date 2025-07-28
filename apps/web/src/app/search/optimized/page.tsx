"use client";

import AdvancedFilterSidebar from "@/components/search/AdvancedFilterSidebar";
import SearchBar from "@/components/search/SearchBar";
import { SortOptions } from "@/components/search/SortOptions";
import type { LatLngTuple } from "leaflet";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { MOCK_PROPERTIES } from "public/mock-data";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PropertyGrid } from "~/components/search/PropertyGrid";
import type { FullPropertyProps } from "public/mock-data";

const PropertyMap = dynamic(() => import("@/components/search/Map"), {
  ssr: false,
});

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
  sortOrder: "asc" | "desc";
}

export default function OptimizedSearchPage() {
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [isCached, setIsCached] = useState(false);

  const searchParams = useSearchParams();
  const observerRef = useRef<IntersectionObserver>();
  const loadingRef = useRef<HTMLDivElement>(null);

  const center: LatLngTuple = [-34.61, -58.39];
  const markers: { position: LatLngTuple; title: string }[] = [
    { position: [-34.61, -58.39], title: "Modern Apartment with Kitchen" },
    { position: [-34.6, -58.37], title: "Cozy Studio Apartment" },
  ];

  // Initialize filters from URL params or defaults
  const [filters, setFilters] = useState<AdvancedFilters>(() => {
    const location = searchParams.get("location") || "";
    const minPrice = Number.parseInt(searchParams.get("minPrice") || "0");
    const maxPrice = Number.parseInt(searchParams.get("maxPrice") || "1000");

    return {
      price: {
        min: minPrice || 0,
        max: maxPrice || 1000,
      },
      amenities: {},
      propertyType: [],
      guests: { min: 1, max: 10 },
      bedrooms: { min: 1, max: 5 },
      bathrooms: { min: 1, max: 5 },
      rating: 0,
      dates: {},
      location: { radius: 50 },
      sortBy: "relevance",
      sortOrder: "desc",
    };
  });

  // Get min/max price range
  const minMax = useMemo(() => {
    const sorted = [...MOCK_PROPERTIES].sort((a, b) => a.price - b.price);
    return [sorted[0]?.price || 0, sorted.at(-1)?.price || 0] as [
      number,
      number
    ];
  }, []);

  // Simulate API call with caching and performance tracking
  const performSearch = useCallback(
    async (
      searchFilters: AdvancedFilters,
      pageNum: number,
      isNewSearch = false
    ) => {
      const startTime = Date.now();
      setIsLoading(true);

      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Apply filters to mock data
        let filtered = [...MOCK_PROPERTIES];

        // Location filter
        const location = searchParams.get("location")?.toLowerCase() || "";
        if (location) {
          filtered = filtered.filter((p) =>
            p.location.toLowerCase().includes(location)
          );
        }

        // Price filter
        filtered = filtered.filter(
          (p) =>
            p.price >= searchFilters.price.min &&
            p.price <= searchFilters.price.max
        );

        // Property type filter
        if (searchFilters.propertyType.length > 0) {
          filtered = filtered.filter((p) => {
            // Mock property type mapping
            const propertyTypes = {
              apartment: ["apartment", "studio"],
              house: ["house", "villa"],
              villa: ["villa"],
              studio: ["studio"],
              loft: ["loft"],
            };

            return searchFilters.propertyType.some((type) =>
              propertyTypes[type as keyof typeof propertyTypes]?.includes(
                p.type?.toLowerCase() || ""
              )
            );
          });
        }

        // Amenities filter
        const selectedAmenities = Object.entries(searchFilters.amenities)
          .filter(([, checked]) => checked)
          .map(([key]) => key.toLowerCase());

        if (selectedAmenities.length > 0) {
          filtered = filtered.filter((p) =>
            selectedAmenities.every((am) =>
              p.amenities.map((a: string) => a.toLowerCase()).includes(am)
            )
          );
        }

        // Guest capacity filter
        filtered = filtered.filter(
          (p) =>
            p.maxGuests >= searchFilters.guests.min &&
            p.maxGuests <= searchFilters.guests.max
        );

        // Bedrooms filter
        filtered = filtered.filter(
          (p) =>
            p.bedrooms >= searchFilters.bedrooms.min &&
            p.bedrooms <= searchFilters.bedrooms.max
        );

        // Bathrooms filter
        filtered = filtered.filter(
          (p) =>
            p.bathrooms >= searchFilters.bathrooms.min &&
            p.bathrooms <= searchFilters.bathrooms.max
        );

        // Rating filter
        if (searchFilters.rating > 0) {
          filtered = filtered.filter((p) => p.rating >= searchFilters.rating);
        }

        // Sort results
        switch (searchFilters.sortBy) {
          case "price_asc":
            filtered.sort((a, b) => a.price - b.price);
            break;
          case "price_desc":
            filtered.sort((a, b) => b.price - a.price);
            break;
          case "rating":
            filtered.sort((a, b) => b.rating - a.rating);
            break;
          case "distance":
            filtered.sort((a, b) => {
              const aDist = Number.parseFloat(a.distance);
              const bDist = Number.parseFloat(b.distance);
              return aDist - bDist;
            });
            break;
          case "newest":
            filtered.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
            break;
          default:
            // Relevance sorting (default)
            break;
        }

        // Apply pagination
        const pageSize = 12;
        const startIndex = (pageNum - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedResults = filtered.slice(startIndex, endIndex);

        const searchTime = Date.now() - startTime;
        setSearchTime(searchTime);
        setIsCached(Math.random() > 0.7); // Simulate cache hits

        if (isNewSearch) {
          setSearchResults(paginatedResults);
          setPage(1);
        } else {
          setSearchResults((prev) => [...prev, ...paginatedResults]);
        }

        setTotalResults(filtered.length);
        setHasMore(endIndex < filtered.length);

        console.log(
          `🔍 Search completed in ${searchTime}ms (${paginatedResults.length} results, ${filtered.length} total)`
        );
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [searchParams]
  );

  // Initial search
  useEffect(() => {
    performSearch(filters, 1, true);
  }, [filters, performSearch]);

  // Infinite scroll setup
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;

      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            performSearch(filters, nextPage);
            return nextPage;
          });
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, hasMore, filters, performSearch]
  );

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: AdvancedFilters) => {
    setFilters(newFilters);
    setPage(1);
    setHasMore(true);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((sortBy: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Find Your Perfect Stay
          </h1>
          <SearchBar />
        </div>

        {/* Search Stats */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {totalResults} properties found
            </span>
            {searchTime > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Search time: {searchTime}ms
              </span>
            )}
            {isCached && (
              <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Cached
              </span>
            )}
          </div>
          <SortOptions onSortChange={handleSortChange} />
        </div>

        <div className="flex gap-8">
          {/* Advanced Filters Sidebar */}
          <AdvancedFilterSidebar
            filters={filters}
            minAndMaxPrice={minMax}
            onFiltersChange={handleFiltersChange}
            center={center}
            markers={markers}
            isLoading={isLoading}
          />

          {/* Search Results */}
          <div className="flex-1 md:ml-80">
            {searchResults.length > 0 ? (
              <div className="space-y-6">
                <PropertyGrid properties={searchResults} />

                {/* Infinite scroll trigger */}
                {hasMore && (
                  <div
                    ref={lastElementRef}
                    className="flex justify-center py-8"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">
                          Loading more...
                        </span>
                      </div>
                    ) : (
                      <div className="h-8" /> // Invisible trigger
                    )}
                  </div>
                )}

                {/* End of results */}
                {!hasMore && searchResults.length > 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>You've reached the end of the results</p>
                  </div>
                )}
              </div>
            ) : !isLoading ? (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No properties found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile Map Button */}
        <div className="fixed bottom-4 right-4 md:hidden">
          <button className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
