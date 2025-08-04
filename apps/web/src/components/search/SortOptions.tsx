'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const sortOptions = [
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Rating', value: 'rating' },
  { label: 'Distance', value: 'distance' },
  { label: 'Newest', value: 'newest' },
];

export function SortOptions({
  onSortChange,
}: {
  onSortChange: (sortValue: string) => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultSort = searchParams.get('sort') || 'price_asc';
  const [selected, setSelected] = useState(
    sortOptions.find((opt) => opt.value === defaultSort) || sortOptions[0]
  );

  useEffect(() => {
    const current = searchParams.get('sort');
    if (current && current !== selected.value) {
      setSelected(sortOptions.find((opt) => opt.value === current) || sortOptions[0]);
    }
  }, [searchParams, selected.value]);

  const updateUrl = (value: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('sort', value);
    router.replace(`/search?${params.toString()}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full sm:w-60 md:w-72 flex justify-between items-center px-3 py-2 text-sm bg-background dark:bg-input/30 border dark:border-muted shadow-sm"
        >
          <span className="truncate">{selected.label}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-full sm:w-60 md:w-72 z-50 shadow-xl bg-background dark:bg-input/80 border dark:border-muted"
        align="start"
      >
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => {
              setSelected(option);
              updateUrl(option.value);
              onSortChange(option.value);
            }}
            className="cursor-pointer text-sm"
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
