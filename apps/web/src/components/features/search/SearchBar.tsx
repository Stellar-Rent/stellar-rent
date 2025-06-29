'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';

// Schema for form validation
const searchSchema = z.object({
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location is too long'),
  checkIn: z
    .string()
    .optional()
    .refine((date) => !date || new Date(date) >= new Date(), {
      message: 'Check-in date must be today or later',
    }),
  checkOut: z
    .string()
    .optional()
    .refine((date) => !date || new Date(date) >= new Date(), {
      message: 'Check-out date must be today or later',
    }),
  guests: z
    .number()
    .int()
    .min(1, 'At least 1 guest required')
    .max(16, 'Maximum 16 guests allowed')
    .optional(),
});

type SearchFormData = z.infer<typeof searchSchema>;

// Mock locations for autocomplete
const LOCATIONS = [
  'Luján, Buenos Aires',
  'San Isidro, Buenos Aires',
  'Palermo, Buenos Aires',
  'Córdoba, Argentina',
  'Mendoza, Argentina',
  'Rosario, Santa Fe',
];

export const SearchBar = () => {
  const [formData, setFormData] = useState<SearchFormData>({
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate single field
  const validateField = (field: keyof SearchFormData, value: string | number): string | null => {
    try {
      const fieldSchema = z.object({ [field]: searchSchema.shape[field] });
      fieldSchema.parse({ [field]: value });
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0].message;
      }
      return 'Invalid input';
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, location: value });

    // Only show validation error if user has typed something
    if (value) {
      const fieldError = validateField('location', value);
      setError(fieldError);
    } else {
      setError(null);
    }

    // Filter suggestions based on input
    if (value.length > 1) {
      const filtered = LOCATIONS.filter((loc) => loc.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setFormData({ ...formData, location: suggestion });
    setShowSuggestions(false);
    setError(null);
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

      // Validate check-in/check-out date relationship
      if (validated.checkIn && validated.checkOut) {
        const checkInDate = new Date(validated.checkIn);
        const checkOutDate = new Date(validated.checkOut);

        if (checkOutDate <= checkInDate) {
          setError('Check-out date must be after check-in date');
          setIsSubmitting(false);
          return;
        }

        // Validate dates are not too far in the future (e.g., 1 year max)
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        if (checkInDate > oneYearFromNow || checkOutDate > oneYearFromNow) {
          setError('Dates cannot be more than 1 year in the future');
          setIsSubmitting(false);
          return;
        }
      }

      // Here you would handle the search logic
      console.log('Search with:', validated);

      // Mock API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Reset form or redirect based on your needs
      // setFormData({ ...formData, location: '', checkIn: '', checkOut: '' });
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
    <div className="w-full max-w-6xl mx-auto -mt-8 z-10 relative px-4">
      <Card className="p-4 md:p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div
              className={`flex items-center border rounded-md p-2 bg-background ${error ? 'border-red-500' : ''}`}
            >
              <Search className="h-5 w-5 text-muted-foreground mr-2" />
              <Input
                placeholder="Where are you going? (min. 2 characters)"
                value={formData.location}
                onChange={handleLocationChange}
                className="border-0 p-0 focus-visible:ring-0 flex-1"
                aria-label="Location search"
                aria-describedby={error ? 'search-error' : undefined}
                aria-expanded={showSuggestions}
                aria-controls={showSuggestions ? 'location-listbox' : undefined}
                aria-autocomplete="list"
                required
                minLength={2}
              />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <select
                id="location-listbox"
                className="absolute w-full mt-1 bg-background border rounded-md shadow-md z-20 max-h-48 overflow-y-auto"
                size={Math.min(suggestions.length, 5)}
                onChange={(e) => selectSuggestion(e.target.value)}
                onBlur={() => setShowSuggestions(false)}
              >
                {suggestions.map((suggestion) => (
                  <option
                    key={suggestion}
                    value={suggestion}
                    className="p-2 hover:bg-muted cursor-pointer"
                  >
                    {suggestion}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-1 md:flex-row gap-2">
            <div className="flex items-center border rounded-md p-2 bg-background flex-1">
              <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
              <Input
                type="date"
                placeholder="Check-in"
                value={formData.checkIn}
                onChange={(e) => {
                  setFormData({ ...formData, checkIn: e.target.value });
                  setError(null);
                }}
                className="border-0 p-0 focus-visible:ring-0"
                aria-label="Check-in date"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex items-center border rounded-md p-2 bg-background flex-1">
              <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
              <Input
                type="date"
                placeholder="Check-out"
                value={formData.checkOut}
                onChange={(e) => {
                  setFormData({ ...formData, checkOut: e.target.value });
                  setError(null);
                }}
                className="border-0 p-0 focus-visible:ring-0"
                aria-label="Check-out date"
                min={formData.checkIn || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="flex flex-row gap-4">
            <div className="flex items-center border rounded-md p-2 bg-background">
              <Users className="h-5 w-5 text-muted-foreground mr-2" />
              <Input
                type="number"
                min="1"
                max="16"
                step="1"
                placeholder="Guests"
                value={formData.guests}
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value) || 1;
                  setFormData({
                    ...formData,
                    guests: value,
                  });
                  const fieldError = validateField('guests', value);
                  setError(fieldError);
                }}
                className="border-0 p-0 focus-visible:ring-0 w-16"
                aria-label="Number of guests"
              />
            </div>

            <Button
              type="submit"
              className="bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-700 dark:hover:bg-blue-600"
              disabled={isSubmitting || !!error}
            >
              {isSubmitting ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </form>

        {error && (
          <div id="search-error" className="text-red-500 text-sm mt-2" role="alert">
            {error}
          </div>
        )}
      </Card>
    </div>
  );
};
