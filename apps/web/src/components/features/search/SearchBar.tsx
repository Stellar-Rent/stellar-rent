'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { z } from 'zod';
import { IconContainer } from '@/components/ui/icon-container';

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
  const [formData] = useState<SearchFormData>({
    location: '',
    date: '',
    guests: 2,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    }
  };

  return (
    <div className="w-full" ref={searchBarRef}>
      <div className="bg-secondary rounded-3xl p-1.5">
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row justify-start gap-4">
          {/* Location Field */}
          <div className="flex relative group">
            <div className="flex items-center rounded-2xl p-4 gap-3">
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
              <div className="flex flex-col">
                <p className="text-white font-semibold text-base block">Location</p>
                <p className="text-xs text-gray-400 mt-1">Search by country or city</p>
              </div>
            </div>
          </div>

          <div className="w-px h-16 bg-gray-600/30 self-center" />

          {/* Date Field */}
          <div className="flex relative group">
            <div className="flex items-center rounded-2xl p-4 gap-3">
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
              <div className="flex flex-col">
                <p className="text-white font-semibold text-base block">Date</p>
                <p className="text-xs text-gray-400 mt-1">Select a date</p>
              </div>
            </div>
          </div>

          <div className="w-px h-16 bg-gray-600/30 self-center" />

          {/* Guests Field */}
          <div className="flex relative group">
            <div className="flex items-center rounded-2xl p-4 gap-3">
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
              <div className="flex flex-col">
                <p className="text-white font-semibold text-base block">Guests</p>
                <p className="text-xs text-gray-400 mt-1">2 Guests (1 Adult - 1 Kid)</p>
              </div>
            </div>
          </div>
        </form>

        {error && (
          <div
            id="search-error"
            className="text-red-400 text-sm mt-4 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-in slide-in-from-top-2 duration-200"
            role="alert"
          >
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse" />
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
