'use client';

import { format } from 'date-fns/format';
import { Calendar as CalendarIcon, Search, Users } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

import z from 'zod';
import { InlineError } from '../ui/error-display';

const searchSchema = z.object({
  location: z.string().min(2, 'Location must be at least 2 characters').max(100),
  checkIn: z
    .date()
    .optional()
    .refine((date) => !date || date > new Date(new Date().setHours(0, 0, 0, 0)), {
      message: 'Check-in date must be in the future',
    }),
  checkOut: z
    .date()
    .optional()
    .refine((date) => !date || date >= new Date(), {
      message: 'Check-out date must be today or later',
    }),
  guests: z.number().int().min(1, 'At least 1 guest required').max(16).optional(),
});

const LOCATIONS = [
  'Luján, Buenos Aires',
  'San Isidro, Buenos Aires',
  'Palermo, Buenos Aires',
  'Córdoba, Argentina',
  'Mendoza, Argentina',
  'Rosario, Santa Fe',
];

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set(key, value);
    router.replace(`/search?${params.toString()}`);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    updateParams('location', value);
    if (value.length > 1) {
      const filtered = LOCATIONS.filter((loc) => loc.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }

    // Clear error when user types
    if (error) setError(null);
  };

  const selectSuggestion = (suggestion: string) => {
    setLocation(suggestion);
    setShowSuggestions(false);
    updateParams('location', suggestion);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      searchSchema.parse({ location, checkIn, checkOut, guests });
      setError(null);
      // Logic for actual search submission if needed
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
    }
  };

  useEffect(() => {
    const paramsLocation = searchParams.get('location') || '';
    const paramsGuests = Number.parseInt(searchParams.get('guests') || '2');
    const paramsCheckIn = searchParams.get('checkIn');
    const paramsCheckOut = searchParams.get('checkOut');

    setLocation(paramsLocation);
    setGuests(paramsGuests);

    if (paramsCheckIn) {
      const checkInDate = new Date(paramsCheckIn);
      if (!Number.isNaN(checkInDate.getTime())) {
        setCheckIn(checkInDate);
      }
    }
    if (paramsCheckOut) {
      const checkOutDate = new Date(paramsCheckOut);
      if (!Number.isNaN(checkOutDate.getTime())) {
        setCheckOut(checkOutDate);
      }
    }
  }, [searchParams]);

  return (
    <div className="w-full space-y-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 p-2 sm:p-3 border rounded-xl bg-background dark:bg-input/30 text-[#182A47] dark:text-[#C2F2FF]"
      >
        {/* Location */}
        <div className="relative flex items-center gap-1 px-2 py-1 rounded-lg border border-transparent focus-within:border-blue-500 w-full sm:w-auto bg-white dark:bg-[#0B1D39] transition-colors">
          <Search className="w-4 h-4 text-blue-600" />
          <input
            type="text"
            placeholder="Where to?"
            className="text-sm bg-transparent outline-none w-full sm:w-32"
            value={location}
            onChange={handleLocationChange}
            onBlur={(e) => {
              if (!e.relatedTarget || !e.relatedTarget.closest('.suggestions-container')) {
                setTimeout(() => setShowSuggestions(false), 200);
              }
            }}
          />
          {showSuggestions && (
            <div className="suggestions-container absolute left-0 top-full mt-1 z-30 w-full bg-white dark:bg-[#0B1D39] border rounded-md shadow-md max-h-40 overflow-y-auto text-sm">
              {suggestions.map((sug) => (
                <button
                  type="button"
                  key={sug}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-blue-900/40 cursor-pointer"
                  onClick={() => selectSuggestion(sug)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectSuggestion(sug);
                    }
                  }}
                  tabIndex={0}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-1 w-full sm:w-auto">
          {/* Check-in */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="text-xs px-2 py-1 border rounded-lg bg-white dark:bg-[#0B1D39] flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-blue-900/20"
              >
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                {checkIn ? format(checkIn, 'MMM d') : 'Check-in'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="min-w-[300px] p-0" align="start">
              <Calendar
                mode="single"
                className="w-full"
                selected={checkIn}
                onSelect={(d: Date | undefined) => {
                  setCheckIn(d);
                  if (d) updateParams('checkIn', d.toISOString());
                  setError(null);
                }}
                disabled={(d: Date) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>

          {/* Check-out */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="text-xs px-2 py-1 border rounded-lg bg-white dark:bg-[#0B1D39] flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-blue-900/20"
              >
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                {checkOut ? format(checkOut, 'MMM d') : 'Check-out'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="min-w-[300px] p-0" align="start">
              <Calendar
                mode="single"
                className="w-full"
                selected={checkOut}
                onSelect={(d: Date | undefined) => {
                  setCheckOut(d);
                  if (d) updateParams('checkOut', d.toISOString());
                  setError(null);
                }}
                disabled={(d: Date) => d < (checkIn || new Date(new Date().setHours(0, 0, 0, 0)))}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Guests */}
        <div className="flex items-center gap-1 px-2 py-1 border rounded-lg w-full sm:w-auto bg-white dark:bg-[#0B1D39] focus-within:border-blue-500 transition-colors">
          <Users className="w-4 h-4 text-blue-600" />
          <input
            type="number"
            placeholder="Guests"
            className="text-sm bg-transparent outline-none w-full sm:w-16"
            value={guests}
            min={1}
            max={16}
            onChange={(e) => {
              const val = Number(e.target.value);
              setGuests(val);
              updateParams('guests', val.toString());
              setError(null);
            }}
          />
        </div>

        {/* Hidden submit for keyboard support */}
        <button type="submit" className="hidden">
          Search
        </button>
      </form>

      {error && (
        <div className="px-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <InlineError message={error} onRetry={() => setError(null)} />
        </div>
      )}
    </div>
  );
}
