'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';

// Schema for form validation
const searchSchema = z.object({
  location: z.string().min(2, 'Location must be at least 2 characters'),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.number().int().min(1).max(16).optional(),
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

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, location: value });

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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = searchSchema.parse(formData);
      console.log('Search with:', validated);
      // Here you would handle the search logic
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto -mt-8 z-10 relative px-4">
      <Card className="p-4 md:p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="flex items-center border rounded-md p-2 bg-background">
              <Search className="h-5 w-5 text-muted-foreground mr-2" />
              <Input
                placeholder="Where are you going?"
                value={formData.location}
                onChange={handleLocationChange}
                className="border-0 p-0 focus-visible:ring-0 flex-1"
              />
            </div>

            {showSuggestions && (
              <div 
                className="absolute w-full mt-1 bg-background border rounded-md shadow-md z-20 max-h-48 overflow-y-auto"
                role="listbox"
                aria-label="Location suggestions"
                tabIndex={-1}
              >
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full text-left p-2 hover:bg-muted cursor-pointer focus:bg-muted focus:outline-none"
                    role="option"
                    aria-selected={formData.location === suggestion}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        selectSuggestion(suggestion);
                      }
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-1 md:flex-row gap-2">
            <div className="flex items-center border rounded-md p-2 bg-background flex-1">
              <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
              <Input
                type="date"
                placeholder="Check-in"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                className="border-0 p-0 focus-visible:ring-0"
              />
            </div>

            <div className="flex items-center border rounded-md p-2 bg-background flex-1">
              <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
              <Input
                type="date"
                placeholder="Check-out"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                className="border-0 p-0 focus-visible:ring-0"
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    guests: Number.parseInt(e.target.value) || 1,
                  })
                }
                className="border-0 p-0 focus-visible:ring-0 w-16"
              />
            </div>

            <Button
              type="submit"
              className="bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              Search
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
