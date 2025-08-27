import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';

export interface SearchFilters {
  city?: string;
  country?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
  amenities?: string[];
  status?: 'available' | 'booked' | 'maintenance';
  from?: string;
  to?: string;
  property_type?: string;
  instant_book?: boolean;
  free_cancellation?: boolean;
  latitude?: number;
  longitude?: number;
  radius?: number;
  search_text?: string;
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  sort_by?: 'price' | 'created_at' | 'title' | 'relevance' | 'distance';
  sort_order?: 'asc' | 'desc';
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  amenities: string[];
  images: string[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  ownerId: string;
  status: 'available' | 'booked' | 'maintenance';
  availability: Array<{ from: string; to: string }>;
  securityDeposit?: number;
  cancellationPolicy?: any;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResponse {
  properties: Property[];
  total: number;
  page: number;
  limit: number;
}

export interface UseSearchReturn {
  properties: Property[];
  total: number;
  page: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  options: SearchOptions;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setOptions: (options: Partial<SearchOptions>) => void;
  search: () => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function useSearch(
  initialFilters: SearchFilters = {},
  initialOptions: SearchOptions = {}
): UseSearchReturn {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<SearchFilters>(initialFilters);
  const [options, setOptionsState] = useState<SearchOptions>({
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
    ...initialOptions,
  });

  // Debounce search text to avoid too many API calls
  const debouncedSearchText = useDebounce(filters.search_text, 500);

  const buildQueryParams = useCallback(
    (searchFilters: SearchFilters, searchOptions: SearchOptions): string => {
      const params = new URLSearchParams();

      // Add filters
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.set(key, value.join(','));
          } else {
            params.set(key, String(value));
          }
        }
      });

      // Add options
      Object.entries(searchOptions).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      });

      return params.toString();
    },
    []
  );

  const searchAPI = useCallback(
    async (
      searchFilters: SearchFilters,
      searchOptions: SearchOptions,
      _append = false
    ): Promise<SearchResponse> => {
      const queryParams = buildQueryParams(searchFilters, searchOptions);
      const response = await fetch(`${API_BASE_URL}/properties?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      return data.data;
    },
    [buildQueryParams]
  );

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const searchFilters = { ...filters };
      if (debouncedSearchText !== undefined) {
        searchFilters.search_text = debouncedSearchText;
      }

      const result = await searchAPI(searchFilters, { ...options, page: 1 });

      setProperties(result.properties);
      setTotal(result.total);
      setPage(1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during search';
      setError(errorMessage);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearchText, options, searchAPI]);

  const loadMore = useCallback(async () => {
    if (loading || properties.length >= total) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const searchFilters = { ...filters };
      if (debouncedSearchText !== undefined) {
        searchFilters.search_text = debouncedSearchText;
      }

      const result = await searchAPI(searchFilters, { ...options, page: nextPage });

      setProperties((prev) => [...prev, ...result.properties]);
      setPage(nextPage);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while loading more properties';
      setError(errorMessage);
      console.error('Load more error:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, properties.length, total, page, filters, debouncedSearchText, options, searchAPI]);

  const setFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const setOptions = useCallback((newOptions: Partial<SearchOptions>) => {
    setOptionsState((prev) => ({ ...prev, ...newOptions }));
  }, []);

  const reset = useCallback(() => {
    setProperties([]);
    setTotal(0);
    setPage(1);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debouncedSearchText !== filters.search_text) {
      search();
    }
  }, [debouncedSearchText, filters.search_text, search]);

  useEffect(() => {
    const { search_text, ...otherFilters } = filters;
    search();
  }, [filters, search]);

  const hasMore = properties.length < total && properties.length > 0;

  return {
    properties,
    total,
    page,
    hasMore,
    loading,
    error,
    filters,
    options,
    setFilters,
    setOptions,
    search,
    loadMore,
    reset,
  };
}
