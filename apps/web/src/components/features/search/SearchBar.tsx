'use client';

import { IconContainer } from '@/components/ui/icon-container';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { z } from 'zod';
import { ErrorDisplay } from '~/components/ui/error-display';
import { SearchBarSkeleton } from '~/components/ui/skeleton';

// Schema for form validation
const searchSchema = z.object({
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location is too long'),
  date: z.string().optional(),
  guests: z
    .number()
    .int()
    .min(1, 'At least 1 guest required')
    .max(16, 'Maximum 16 guests allowed')
    .optional(),
});

type SearchFormData = z.infer<typeof searchSchema>;

export const SearchBar = () => {
  const [formData, setFormData] = useState<SearchFormData>({
    location: '',
    date: '',
    guests: 2,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchBarRef = useRef<HTMLDivElement>(null);

  const setInitialParams = async (validatedFormInputs: SearchFormData) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));

    params.set('location', validatedFormInputs.location);
    validatedFormInputs.date && params.set('date', validatedFormInputs.date);
    validatedFormInputs.guests && params.set('guests', validatedFormInputs.guests.toString());

    router.replace(`/search?${params.toString()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting || isLoading) return;

    setIsSubmitting(true);
    setIsLoading(true);
    setError(null);

    try {
      // Pre-validate location before full validation
      if (!formData.location || formData.location.length < 2) {
        setError('Please enter a valid location');
        setIsSubmitting(false);
        setIsLoading(false);
        return;
      }

      const validated = searchSchema.parse(formData);
      setInitialParams(validated);

      // Mock API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message);
      } else {
        setError('An unexpected error occurred');
        console.error('Search error:', error);
      }
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <SearchBarSkeleton className="w-full" />;
  }

  return (
    <div className="w-full" ref={searchBarRef}>
      <div className="bg-secondary rounded-3xl p-1.5">
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row justify-start gap-4">
          {/* Location Field */}
          <div className="flex relative group">
            <div className="flex items-center rounded-2xl p-4 gap-3 w-full">
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
                  className="text-white font-semibold text-base block"
                >
                  Location
                </label>
                <input
                  id="location-input"
                  type="text"
                  placeholder="Search by country or city"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="text-xs text-gray-400 mt-1 bg-transparent border-none outline-none placeholder-gray-400 w-full"
                />
              </div>
            </div>
          </div>

          <div className="w-px h-16 bg-gray-600/30 self-center" />

          {/* Date Field */}
          <div className="flex relative group">
            <div className="flex items-center rounded-2xl p-4 gap-3 w-full">
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
              <div className="flex flex-col flex-1">
                <label htmlFor="date-input" className="text-white font-semibold text-base block">
                  Date
                </label>
                <input
                  id="date-input"
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  className="text-xs text-gray-400 mt-1 bg-transparent border-none outline-none placeholder-gray-400 w-full"
                />
              </div>
            </div>
          </div>

          <div className="w-px h-16 bg-gray-600/30 self-center" />

          {/* Guests Field */}
          <div className="flex relative group">
            <div className="flex items-center rounded-2xl p-4 gap-3 w-full">
              <IconContainer
                icon={
                  <Image
                    src="/icons/agenda.webp"
                    alt="Agenda"
                    width={28}
                    height={28}
                    className="p-1"
                  />
                }
              />
              <div className="flex flex-col flex-1">
                <label htmlFor="guests-select" className="text-white font-semibold text-base block">
                  Guests
                </label>
                <select
                  id="guests-select"
                  value={formData.guests || 2}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, guests: Number.parseInt(e.target.value) }))
                  }
                  className="text-xs text-gray-400 mt-1 bg-transparent border-none outline-none w-full"
                >
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num} className="bg-gray-800 text-white">
                      {num} Guest{num !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="w-px h-16 bg-gray-600/30 self-center" />

          {/* Search Button */}
          <div className="flex items-center">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-semibold transition-colors flex items-center gap-2"
            >
              {isSubmitting || isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && <ErrorDisplay error={error} variant="inline" className="mt-4" />}
      </div>
    </div>
  );
};
