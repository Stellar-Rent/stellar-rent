'use client';

import { IconContainer } from '@/components/ui/icon-container';
import { format } from 'date-fns/format';
import { Loader2, Minus, Plus, Search } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { Calendar } from '../../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';

import { InlineError } from '@/components/ui/error-display';

// Schema for form validation
const searchSchema = z.object({
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location is too long'),
  date: z.string().optional(),
  adults: z.number().int().min(1, 'At least 1 adult required').max(16, 'Maximum 16 adults allowed'),
  kids: z.number().int().min(0).max(10, 'Maximum 10 kids allowed'),
});

type SearchFormData = z.infer<typeof searchSchema>;

// Locations for autocomplete
const LOCATIONS = [
  'Luján, Buenos Aires',
  'San Isidro, Buenos Aires',
  'Palermo, Buenos Aires',
  'Córdoba, Argentina',
  'Mendoza, Argentina',
  'Rosario, Santa Fe',
  'New York, NY',
  'Los Angeles, CA',
  'Miami, FL',
  'Seattle, WA',
  'San Francisco, CA',
  'Chicago, IL',
  'Austin, TX',
];

export const SearchBar = () => {
  const [formData, setFormData] = useState<SearchFormData>({
    location: '',
    date: '',
    adults: 1,
    kids: 1,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showGuestsPopover, setShowGuestsPopover] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const router = useRouter();
  const searchBarRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, location: value }));

    if (value.length > 1) {
      const filtered = LOCATIONS.filter((loc) => loc.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, []);

  const selectSuggestion = useCallback((suggestion: string) => {
    setFormData((prev) => ({ ...prev, location: suggestion }));
    setShowSuggestions(false);
  }, []);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setFormData((prev) => ({ ...prev, date: date.toISOString() }));
    }
  }, []);

  const updateGuests = useCallback((type: 'adults' | 'kids', increment: boolean) => {
    setFormData((prev) => {
      const currentValue = prev[type];
      let newValue: number;

      if (increment) {
        newValue =
          type === 'adults' ? Math.min(currentValue + 1, 16) : Math.min(currentValue + 1, 10);
      } else {
        newValue =
          type === 'adults' ? Math.max(currentValue - 1, 1) : Math.max(currentValue - 1, 0);
      }

      return { ...prev, [type]: newValue };
    });
  }, []);

  const totalGuests = formData.adults + formData.kids;
  const guestsLabel = `${totalGuests} Guest${totalGuests !== 1 ? 's' : ''} (${formData.adults} Adult${formData.adults !== 1 ? 's' : ''}${formData.kids > 0 ? ` - ${formData.kids} Kid${formData.kids !== 1 ? 's' : ''}` : ''})`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Pre-validate location before full validation
      if (!formData.location || formData.location.length < 2) {
        setError('Please enter a valid location');
        setIsSubmitting(false);
        return;
      }

      const validated = searchSchema.parse(formData);

      // Build search params
      const params = new URLSearchParams();
      params.set('location', validated.location);
      if (validated.date) params.set('date', validated.date);
      params.set('guests', (validated.adults + validated.kids).toString());
      params.set('adults', validated.adults.toString());
      params.set('kids', validated.kids.toString());

      // Navigate to search page with filters
      router.push(`/search?${params.toString()}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message);
      } else {
        setError('An unexpected error occurred');
        console.error('Search error:', error);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full" ref={searchBarRef}>
      <div className="bg-secondary rounded-3xl p-1.5">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col lg:flex-row justify-between items-center gap-2 lg:gap-4"
        >
          {/* Location Field */}
          <div className="flex relative group w-full lg:w-auto">
            <div className="flex items-center rounded-2xl p-3 lg:p-4 gap-3 w-full">
              <IconContainer
                icon={
                  <Image
                    src="/icons/location.webp"
                    alt="Location"
                    width={28}
                    height={28}
                    className="p-1"
                  />
                }
              />
              <div className="flex flex-col flex-1">
                <label
                  htmlFor="location-input"
                  className="text-white font-semibold text-sm lg:text-base block cursor-pointer"
                >
                  Location
                </label>
                <input
                  id="location-input"
                  ref={locationInputRef}
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onFocus={() => {
                    if (formData.location.length > 1) {
                      setShowSuggestions(suggestions.length > 0);
                    }
                  }}
                  placeholder="Search by country or city"
                  className="text-xs text-gray-400 mt-1 bg-transparent outline-none placeholder:text-gray-400 w-full"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Location Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute left-0 top-full mt-1 z-50 w-full bg-secondary border border-gray-600/50 rounded-xl shadow-xl overflow-hidden">
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-primary/20 transition-colors flex items-center gap-2"
                  >
                    <Image
                      src="/icons/location.webp"
                      alt=""
                      width={16}
                      height={16}
                      className="opacity-50"
                    />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block w-px h-12 bg-gray-600/30 self-center" />

          {/* Date Field */}
          <div className="flex relative group w-full lg:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center rounded-2xl p-3 lg:p-4 gap-3 w-full hover:bg-white/5 transition-colors"
                >
                  <IconContainer
                    icon={
                      <Image
                        src="/icons/calendar.webp"
                        alt="Calendar"
                        width={28}
                        height={28}
                        className="p-1"
                      />
                    }
                  />
                  <div className="flex flex-col text-left">
                    <p className="text-white font-semibold text-sm lg:text-base block">Date</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select a date'}
                    </p>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-secondary border-gray-600/50" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date()}
                  className="rounded-xl"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="hidden lg:block w-px h-12 bg-gray-600/30 self-center" />

          {/* Guests Field */}
          <div className="flex relative group w-full lg:w-auto">
            <Popover open={showGuestsPopover} onOpenChange={setShowGuestsPopover}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center rounded-2xl p-3 lg:p-4 gap-3 w-full hover:bg-white/5 transition-colors"
                >
                  <IconContainer
                    icon={
                      <Image
                        src="/icons/agenda.webp"
                        alt="Guests"
                        width={28}
                        height={28}
                        className="p-1"
                      />
                    }
                  />
                  <div className="flex flex-col text-left">
                    <p className="text-white font-semibold text-sm lg:text-base block">Guests</p>
                    <p className="text-xs text-gray-400 mt-1">{guestsLabel}</p>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4 bg-secondary border-gray-600/50" align="start">
                <div className="space-y-4">
                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Adults</p>
                      <p className="text-xs text-gray-400">Ages 13 or above</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateGuests('adults', false)}
                        disabled={formData.adults <= 1}
                        className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center text-white hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-white font-medium w-6 text-center">
                        {formData.adults}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateGuests('adults', true)}
                        disabled={formData.adults >= 16}
                        className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center text-white hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Kids */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Kids</p>
                      <p className="text-xs text-gray-400">Ages 2-12</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateGuests('kids', false)}
                        disabled={formData.kids <= 0}
                        className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center text-white hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-white font-medium w-6 text-center">
                        {formData.kids}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateGuests('kids', true)}
                        disabled={formData.kids >= 10}
                        className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center text-white hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setShowGuestsPopover(false)}
                    className="w-full bg-primary text-black hover:bg-primary/90"
                  >
                    Done
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Search Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full lg:w-auto bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-6 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Search</span>
              </>
            )}
          </Button>
        </form>

        {error && (
          <div className="mt-4 px-2">
            <InlineError message={error} />
          </div>
        )}
      </div>
    </div>
  );
};
