"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import PropertyGrid from "@/components/search/PropertyGrid";
import FilterSidebar from "~/components/search/FilterSidebar";
import SearchBar from "~/components/search/SearchBar";
import { SortOptions } from "~/components/search/SortOptions";
import type { LatLngTuple } from "leaflet";
import { MOCK_PROPERTIES } from "public/mock-data";

const PropertyMap = dynamic(() => import("@/components/search/Map"), {
  ssr: false
});

export default function SearchPage() {
  const [page, setPage] = useState(1);
  const pageSize = 3;
  const [sort, setSort] = useState("price_asc");
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    price: 0,
    amenities: {} as Record<string, boolean>,
    rating: 0
  });
  const searchParams = useSearchParams();

  const center: LatLngTuple = [-34.61, -58.39];
  const markers: { position: LatLngTuple; title: string }[] = [
    { position: [-34.61, -58.39], title: "Modern Apartment with Kitchen" },
    { position: [-34.6, -58.37], title: "Cozy Studio Apartment" }
  ];

  // Filter & sort properties with memoization
  const filteredSortedProperties = useMemo(() => {
    let result = [...MOCK_PROPERTIES];

    const location = searchParams.get("location")?.toLowerCase() || "";
    if (location) {
      result = result.filter((p) =>
        p.location.toLowerCase().includes(location)
      );
    }

    result = result.filter((p) => p.price >= filters.price);

    const selectedAmenities = Object.entries(filters.amenities)
      .filter(([, checked]) => checked)
      .map(([key]) => key.toLowerCase());

    if (selectedAmenities.length > 0) {
      result = result.filter((p) =>
        selectedAmenities.every((am) =>
          p.amenities.map((a) => a.toLowerCase()).includes(am)
        )
      );
    }

    if (filters.rating > 0) {
      result = result.filter((p) => p.rating >= filters.rating);
    }

    if (sort === "price_asc") result.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") result.sort((a, b) => b.price - a.price);
    if (sort === "rating") result.sort((a, b) => b.rating - a.rating);
    if (sort === "distance") {
      result.sort((a, b) => {
        const aDist = Number.parseFloat(a.distance);
        const bDist = Number.parseFloat(b.distance);
        return aDist - bDist;
      });
    }

    return result;
  }, [filters, sort, searchParams]);

  const visibleProperties = useMemo(() => {
    return filteredSortedProperties.slice(0, page * pageSize);
  }, [filteredSortedProperties, page]);

  const loadNextPage = useCallback(() => {
    if (isLoading) return;
    setIsLoading(true);
    setTimeout(() => {
      setPage((prev) => prev + 1);
      setIsLoading(false);
    }, 200); // simulate load
  }, [isLoading]);

  const minMax = useMemo(() => {
    const sorted = [...MOCK_PROPERTIES].sort((a, b) => a.price - b.price);
    return [sorted[0]?.price || 0, sorted.at(-1)?.price || 0] as [
      number,
      number
    ];
  }, []);

  return (
    <main className="px-4 py-6 mt-10 bg-[#CFF0FF] dark:bg-[#0B1D39] text-[#182A47] dark:text-[#C2F2FF] space-y-6">
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
              <PropertyGrid
                properties={visibleProperties}
                onLoadMore={loadNextPage}
              />
              {isLoading && (
                <p className="text-center my-4">Loading more properties...</p>
              )}
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
