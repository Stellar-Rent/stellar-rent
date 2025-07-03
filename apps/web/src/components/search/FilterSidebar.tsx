"use client";

import { useState, useEffect } from "react";

const AMENITIES = ["Wifi", "Pool", "Pet Friendly", "Parking space", "Garden"];

export default function FilterSidebar({
  filters,
  minAndMaxPrice,
  onFiltersChange
}: {
  filters: any;
  minAndMaxPrice: [number, number];
  onFiltersChange: (newFilters: any) => void;
}) {
  const [price, setPrice] = useState(filters.price || minAndMaxPrice[0]);
  const [amenities, setAmenities] = useState<{ [key: string]: boolean }>(
    filters.amenities || {}
  );
  const [rating, setRating] = useState(filters.rating || 0);

  useEffect(() => {
    onFiltersChange({ price, amenities, rating });
  }, [price, amenities, rating]);

  return (
    <aside className="p-4 bg-background dark:bg-input/30 rounded-xl mt-8 shadow-md space-y-6 text-[#182A47] dark:text-[#C2F2FF] md:fixed  md:h-[90vh] sm:w-64">
      <div className="grid gap-2">
        <small className="text-center">${price}</small>
        <div className="flex gap-1 text-sm items-center">
          <h4 className="font-semibold mb-1 text-sm">${minAndMaxPrice[0]}</h4>
          <input
            type="range"
            min={minAndMaxPrice[0]}
            max={minAndMaxPrice[1]}
            step={100}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full"
          />
          <h4 className="font-semibold mb-1 text-sm">${minAndMaxPrice[1]}</h4>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-1">Amenities</h4>
        {AMENITIES.map((amenity, index) => {
          const key = amenity.toLowerCase();
          return (
            <label key={index} className="flex items-center gap-2">
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
              {amenity}
            </label>
          );
        })}
      </div>

      <div>
        <h4 className="font-semibold mb-1">Minimum Rating</h4>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="p-2 rounded-md bg-white dark:bg-[#0B1D39] border border-gray-300 dark:border-gray-600"
        >
          <option value={0}>Any</option>
          <option value={3}>3 stars+</option>
          <option value={4}>4 stars+</option>
          <option value={4.5}>4.5 stars+</option>
        </select>
      </div>
    </aside>
  );
}
