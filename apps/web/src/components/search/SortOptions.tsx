// ✅ SortOptions.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const sortOptions = [
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Rating", value: "rating" },
  { label: "Distance", value: "distance" },
  { label: "Newest", value: "newest" }
];

export function SortOptions({ onSortChange }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultSort = searchParams.get("sort") || "price_asc";
  const [selected, setSelected] = useState(
    sortOptions.find((opt) => opt.value === defaultSort) || sortOptions[0]
  );

  useEffect(() => {
    const current = searchParams.get("sort");
    if (current && current !== selected.value) {
      setSelected(
        sortOptions.find((opt) => opt.value === current) || sortOptions[0]
      );
    }
  }, [searchParams]);

  const updateUrl = (value: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("sort", value);
    router.replace(`/search?${params.toString()}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[300px] justify-between">
          {selected.label} <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full">
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => {
              setSelected(option);
              updateUrl(option.value);
              onSortChange(option.value);
            }}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
