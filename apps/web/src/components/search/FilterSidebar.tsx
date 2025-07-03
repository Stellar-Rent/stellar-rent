// components/search/FilterSidebar.tsx
"use client";

import { useState } from "react";

export default function FilterSidebar({
  filters,
  onFiltersChange
}: {
  filters: any;
  onFiltersChange: (newFilters: any) => void;
}) {
  const [price, setPrice] = useState(filters.price || 5000);
  const [wifi, setWifi] = useState(false);
  const [pool, setPool] = useState(false);
  const [pets, setPets] = useState(false);
  const [rating, setRating] = useState(filters.rating || 0);

  const updateFilters = () => {
    onFiltersChange({ price, wifi, pool, pets, rating });
  };

  return (
    <aside className="p-4 bg-background dark:bg-input/30 rounded-xl mt-8 shadow-md space-y-6 text-[#182A47] dark:text-[#C2F2FF] w-full h-full sm:w-64">
      <div className="flex gap-1 text-sm items-center">
        <h4 className="font-semibold mb-1 text-sm">${price}</h4>
        <input
          type="range"
          min={500}
          max={10000}
          step={100}
          value={price}
          onChange={(e) => {
            setPrice(Number(e.target.value));
            updateFilters();
          }}
          className="w-full"
        />
        <h4 className="font-semibold mb-1 text-sm">${price}</h4>
      </div>

      <div>
        <h4 className="font-semibold mb-1">Amenities</h4>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={wifi}
            onChange={(e) => {
              setWifi(e.target.checked);
              updateFilters();
            }}
          />
          Wifi
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={pool}
            onChange={(e) => {
              setPool(e.target.checked);
              updateFilters();
            }}
          />
          Pool
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={pets}
            onChange={(e) => {
              setPets(e.target.checked);
              updateFilters();
            }}
          />
          Pet Friendly
        </label>
      </div>

      <div>
        <h4 className="font-semibold mb-1">Minimum Rating</h4>
        <select
          value={rating}
          onChange={(e) => {
            setRating(Number(e.target.value));
            updateFilters();
          }}
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
