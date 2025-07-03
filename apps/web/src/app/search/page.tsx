// app/search/page.tsx
"use client";
import PropertyGrid from "@/components/search/PropertyGrid";
import { useEffect, useState } from "react";
import FilterSidebar from "~/components/search/FilterSidebar";
import MapBoxMap from "~/components/search/Map";
import SearchBar from "~/components/search/SearchBar";
import { SortOptions } from "~/components/search/SortOptions";
import { z } from "zod";
import { useInView } from "react-intersection-observer";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";

const searchQuerySchema = z.object({
  location: z.string(),
  guests: z.string().regex(/^\d+$/),
  dates: z.string().optional()
});

type Property = {
  id: string;
  title: string;
  location: string;
  price: number;
  image: string;
  rating: number;
  distance: string | number;
};

type searchProps = {
  location: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
};

type Props = {
  properties: Property[];
  onRegionChange?: (bounds: mapboxgl.LngLatBoundsLike) => void;
};

const MOCK_PROPERTIES: Property[] = [
  {
    id: "1",
    title: "Modern Apartment with Kitchen",
    location: "Luján, Buenos Aires",
    price: 2500,
    image: "/images/house1.jpg",
    rating: 4.1,
    distance: "30km"
    // lat: -34.61,
    // lng: -58.39
  },
  {
    id: "2",
    title: "Luxury Villa with Pool",
    location: "Luján, Buenos Aires",
    price: 6000,
    image: "/images/house2.jpg",
    rating: 4.8,
    distance: "6km"
    // lat: -34.61,
    // lng: -58.39
  },
  {
    id: "3",
    title: "Cozy Bedroom Suite",
    location: "Luján, Buenos Aires",
    price: 4500,
    image: "/images/house3.jpg",
    rating: 3.9,
    distance: "14km"
  },
  {
    id: "4",
    title: "Elegant Studio Apartment",
    location: "Luján, Buenos Aires",
    price: 5600,
    image: "/images/house4.jpg",
    rating: 4.5,
    distance: "8km"
  },
  {
    id: "5",
    title: "Charming Kitchen Loft",
    location: "Luján, Buenos Aires",
    price: 2100,
    image: "/images/house5.jpg",
    rating: 4.2,
    distance: "12km"
  },
  {
    id: "6",
    title: "Modern Architectural House",
    location: "Luján, Buenos Aires",
    price: 6500,
    image: "/images/house.jpg",
    rating: 4.7,
    distance: "10km"
  },
  {
    id: "7",
    title: "Cozy kitchen home with garden view",
    location: "Luján, Buenos Aires",
    price: 2500,
    image: "/property1.jpg",
    rating: 4.1,
    distance: "30km"
  }
];

export default function SearchPage() {
  const [properties, setProperties] = useState(MOCK_PROPERTIES);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState("price_asc");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [ref, inView] = useInView();
  const [dataToSearch, setDataToSearch] = useState({
    location: "",
    checkIn: new Date(),
    checkOut: new Date(),
    guests: 1
  });

  const handleMapBoundsChange = (bounds: mapboxgl.LngLatBoundsLike) => {
    console.log("New visible bounds:", bounds);
    // Optionally refetch visible properties
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}`
    );
    const data = await res.json();
    return data.features?.[0]?.place_name;
  };

  useEffect(() => {
    if (inView && !isLoading) {
      // fetchNextPage()
    }
  }, [inView]);

  const handleSearch = (data: searchProps) => {
    if (!data.location) {
      setProperties(MOCK_PROPERTIES);
    } else {
      const filteredProperties = MOCK_PROPERTIES.filter((property) =>
        property.location.toLowerCase().includes(data.location.toLowerCase())
      );

      setProperties(filteredProperties);
    }
  };

  const handleSort = () => {
    //     { label: "Price: Low to High", value: "price_asc" },
    // { label: "Price: High to Low", value: "price_desc" },
    // { label: "Rating", value: "rating" },
    // { label: "Distance", value: "distance" },
    // { label: "Newest", value: "newest" }
    if (sort === "price_asc") {
      properties.sort((prev, cur) => prev.price - cur.price);
    }

    if (sort === "price_desc") {
      properties.sort((prev, cur) => cur.price - prev.price);
    }

    if (sort === "rating") {
      properties.sort((prev, cur) => cur.rating - prev.rating);
    }
    setProperties(properties);

    if (sort === "distance") {
      console.log("distance");
      const sortedByDistance = properties
        .map((property) => ({
          ...property,
          distance:
            typeof property.distance === "string"
              ? Number(property.distance.split("k")[0])
              : property.distance
        }))
        .sort((prev, cur) => prev.distance - cur.distance);
      console.log({ sortedByDistance });
      setProperties(sortedByDistance);
    }

    // console.log(properties);
  };

  // console.log({
  //   mapped: properties
  //     .map((property) => ({
  //       ...property,
  //       distance:
  //         typeof property.distance === "string"
  //           ? Number(property.distance.split("k")[0])
  //           : property.distance
  //     }))
  //     .sort((prev, cur) => prev.distance - cur.distance)
  // });

  useEffect(() => {
    handleSort();
  }, [sort]);

  useEffect(() => {
    const location = searchParams.get("location") || "";
    const checkIn = searchParams.get("checkIn") || new Date();
    const checkOut = searchParams.get("checkOut") || new Date();
    const guests = searchParams.get("guests") || 1;

    const newData = {
      location,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests: Number(guests)
    };

    handleSearch(newData);
  }, [searchParams]);

  return (
    <main className="px-4 py-6 mt-10 bg-[#CFF0FF] dark:bg-[#0B1D39] text-[#182A47] dark:text-[#C2F2FF] space-y-6">
      <div>
        <div className="flex flex-col lg:flex-row gap-6">
          <FilterSidebar filters={filters} onFiltersChange={setFilters} />

          <div className="flex-1 space-y-4">
            <div className="flex justify-between gap-4 items-center border mt-6 px-2  py-2 flex-col md:flex-row">
              <SearchBar />
              <SortOptions sort={sort} onSortChange={setSort} />
            </div>
            <PropertyGrid
              properties={properties}
              filters={filters}
              sort={sort}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
