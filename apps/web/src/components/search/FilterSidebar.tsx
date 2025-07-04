"use client";

import { useState, useEffect } from "react";
import {
  WifiIcon,
  WavesIcon,
  PawPrintIcon,
  ParkingCircleIcon,
  TreePineIcon,
  StarIcon,
  MapIcon
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { SearchBar } from "../features/search/SearchBar";

const AMENITIES = [
  { name: "Wifi", icon: <WifiIcon size={18} /> },
  { name: "Pool", icon: <WavesIcon size={18} /> },
  { name: "Pet Friendly", icon: <PawPrintIcon size={18} /> },
  { name: "Parking space", icon: <ParkingCircleIcon size={18} /> },
  { name: "Garden", icon: <TreePineIcon size={18} /> }
];

const PropertyMap = dynamic(() => import("@/components/search/Map"), {
  ssr: false
});

export default function FilterSidebar({
  filters,
  minAndMaxPrice,
  onFiltersChange,
  center,
  markers
}: {
  filters: any;
  minAndMaxPrice: [number, number];
  onFiltersChange: (newFilters: any) => void;
  center: LatLngExpression;
  markers: {
    position: LatLngExpression;
    title: string;
  }[];
}) {
  const [price, setPrice] = useState(
    filters.price === 0 ? minAndMaxPrice[0] : filters.price
  );
  const [amenities, setAmenities] = useState<{ [key: string]: boolean }>(
    filters.amenities || {}
  );
  const [rating, setRating] = useState(filters.rating || 0);

  useEffect(() => {
    onFiltersChange({ price, amenities, rating });
  }, [price, amenities, rating]);

  console.log({ PropertyMap });
  return (
    <aside
      className="
        p-4 rounded-xl shadow-md 
        text-[#182A47] dark:text-[#C2F2FF] 
        bg-background dark:bg-input/30 
        mt-4 space-y-4 
        w-full sm:flex sm:flex-wrap sm:justify-around 
        md:block md:w-64 md:fixed md:h-[90vh]
      "
    >
      {/* Price Slider */}
      <div className="w-full sm:w-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Price: ${price}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span>${minAndMaxPrice[0]}</span>
          <input
            type="range"
            min={minAndMaxPrice[0]}
            max={minAndMaxPrice[1]}
            step={100}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <span>${minAndMaxPrice[1]}</span>
        </div>
      </div>

      {/* Amenities */}
      <div className="w-full sm:w-auto">
        <h4 className="font-semibold text-sm mb-1 hidden md:block">
          Amenities
        </h4>
        <div className="grid grid-cols-3 gap-2 md:flex md:flex-col">
          {AMENITIES.map(({ name, icon }) => {
            const key = name.toLowerCase();
            return (
              <label
                key={key}
                className="flex items-center gap-1 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!amenities[key]}
                  onChange={(e) =>
                    setAmenities((prev) => ({
                      ...prev,
                      [key]: e.target.checked
                    }))
                  }
                />
                <span className="hidden sm:inline">{name}</span>
                <span className="sm:hidden">{icon}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Rating */}
      <div className="w-full sm:w-auto">
        <h4 className="font-semibold text-sm mb-1 hidden md:block">
          Minimum Rating
        </h4>
        <div className="flex items-center gap-2">
          <StarIcon size={16} className="sm:hidden" />
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="
              p-2 rounded-md text-sm 
              bg-white dark:bg-[#0B1D39] 
              border border-gray-300 dark:border-gray-600 
              text-[#182A47] dark:text-[#C2F2FF] 
              w-full sm:w-auto
            "
          >
            <option value={0}>Any</option>
            <option value={3}>3 stars+</option>
            <option value={4}>4 stars+</option>
            <option value={4.5}>4.5 stars+</option>
          </select>
        </div>
      </div>

      {/* View Map button (Mobile only) */}
      <div className="block md:hidden w-full mt-2">
        <Dialog>
          <DialogTrigger asChild>
            <button
              className="
                w-full flex items-center justify-center gap-2 
                text-sm font-medium 
                bg-blue-600 text-white 
                py-2 px-4 rounded-md 
                hover:bg-blue-700
              "
            >
              <MapIcon size={18} />
              View Map
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw]">
            <DialogHeader>
              <DialogTitle className="text-center mb-2">
                Property Map
              </DialogTitle>
            </DialogHeader>
            <div className="w-full lg:w-[40%] h-[80vh] md:hidden mt-4 lg:mt-12 rounded-2xl border m-0 lg:m-6 block">
              <PropertyMap center={center} markers={markers} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </aside>
  );
}
