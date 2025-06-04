import { z } from 'zod';

export interface Location {
  city: string;
  country: string;
}

export interface LocationSuggestion extends Location {
  id?: string;
  match_type: 'city' | 'country' | 'both';
}

export interface LocationAutocompleteResponse {
  suggestions: LocationSuggestion[];
  total: number;
  query: string;
}

export const autocompleteQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Query must be at least 1 character')
    .max(100, 'Query must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-'.,áéíóúñüÁÉÍÓÚÑÜ]+$/, 'Query contains invalid characters'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 20))
    .refine((val) => val >= 1 && val <= 50, 'Limit must be between 1 and 50'),
});

export type LocationAutocompleteQuery = z.infer<typeof autocompleteQuerySchema>;

// Service response types
export interface LocationServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}
