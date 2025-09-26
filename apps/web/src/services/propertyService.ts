import toast from 'react-hot-toast';
import type { ListingFormValues } from '~/components/properties/ListingForm/types';
import type { PropertySearchFilters, PropertySearchOptions, SearchPropertiesResponse } from '~/types/property';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

let controller: AbortController | null = null;

export const createListing = async (data: ListingFormValues): Promise<unknown> => {
  const token = getAuthToken();
  if (!token) {
    toast.error('Authentication token not found.');
    return;
  }

  if (controller) {
    controller.abort();
  }

  controller = new AbortController();

  try {
    const response = await fetch(`${API_URL}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorResponse = await response.json().catch(() => ({
        message: 'An unknown error occurred.',
      }));
      toast.error(errorResponse.message || 'Failed to create listing.');
      return;
    }

    const result = await response.json();
    toast.success('Listing created successfully!');
    return result;
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'name' in err && err.name === 'AbortError') {
      return;
    }

    if (err instanceof Error) {
      toast.error(`Request failed: ${err.message}`);
      throw new Error(`Request failed: ${err.message}`);
    }

    toast.error('An unexpected error occurred.');
    throw new Error('An unexpected error occurred.');
  }
};

export const searchProperties = async (
  filters: PropertySearchFilters,
  options: PropertySearchOptions = {}
): Promise<SearchPropertiesResponse | null> => {
  if (controller) {
    controller.abort();
  }

  controller = new AbortController();

  try {
    const params = new URLSearchParams();

    if (filters.city) params.append('city', filters.city);
    if (filters.country) params.append('country', filters.country);
    if (filters.min_price !== undefined) params.append('min_price', filters.min_price.toString());
    if (filters.max_price !== undefined) params.append('max_price', filters.max_price.toString());
    if (filters.bedrooms !== undefined) params.append('bedrooms', filters.bedrooms.toString());
    if (filters.bathrooms !== undefined) params.append('bathrooms', filters.bathrooms.toString());
    if (filters.max_guests !== undefined) params.append('max_guests', filters.max_guests.toString());
    if (filters.amenities) params.append('amenities', filters.amenities);
    if (filters.status) params.append('status', filters.status);
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);

    if (options.page !== undefined) params.append('page', options.page.toString());
    if (options.limit !== undefined) params.append('limit', options.limit.toString());
    if (options.sort_by) params.append('sort_by', options.sort_by);
    if (options.sort_order) params.append('sort_order', options.sort_order);

    const response = await fetch(`${API_URL}/properties?${params.toString()}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorResponse = await response.json().catch(() => ({
        message: 'An unknown error occurred.',
      }));
      toast.error(errorResponse.message || 'Failed to search properties.');
      return null;
    }

    const result = await response.json();

    if (result.success) {
      return {
        properties: result.data.properties || result.data || [],
        total: result.data.total || 0,
        page: result.data.page || options.page || 1,
        limit: result.data.limit || options.limit || 10,
      };
    } else {
      toast.error(result.error || 'Search failed.');
      return null;
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return null;
    }
    toast.error('Search request failed.');
    return null;
  }
};
