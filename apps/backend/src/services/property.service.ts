import { supabase } from '../config/supabase';
import type {
  AvailabilityRange,
  CreatePropertyInput,
  Property,
  UpdatePropertyInput,
} from '../types/property.types';
import { propertySchema, updatePropertySchema } from '../types/property.types';

// Allowed amenities list
const ALLOWED_AMENITIES = [
  'wifi',
  'kitchen',
  'washing_machine',
  'air_conditioning',
  'heating',
  'tv',
  'parking',
  'pool',
  'gym',
  'balcony',
  'garden',
  'fireplace',
  'hot_tub',
  'bbq',
  'dishwasher',
  'microwave',
  'coffee_machine',
  'iron',
  'hair_dryer',
  'towels',
  'bed_linen',
  'soap',
  'toilet_paper',
  'shampoo',
  'first_aid_kit',
  'fire_extinguisher',
  'smoke_alarm',
  'carbon_monoxide_alarm',
] as const;

type AllowedAmenity = (typeof ALLOWED_AMENITIES)[number];

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface PropertyListResponse {
  properties: Property[];
  total: number;
  page: number;
  limit: number;
}

export interface PropertySearchFilters {
  city?: string;
  country?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
  amenities?: string[];
  status?: 'available' | 'booked' | 'maintenance';
}

export interface PropertySearchOptions {
  page?: number;
  limit?: number;
  sort_by?: 'price' | 'created_at' | 'title';
  sort_order?: 'asc' | 'desc';
}

// Validation functions
function validateImageUrls(images: string[]): boolean {
  const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
  return images.every((url) => urlRegex.test(url));
}

function validateAmenities(amenities: string[]): { valid: boolean; invalidAmenities: string[] } {
  const invalidAmenities = amenities.filter(
    (amenity) => !ALLOWED_AMENITIES.includes(amenity as AllowedAmenity)
  );

  return {
    valid: invalidAmenities.length === 0,
    invalidAmenities,
  };
}

function validateAvailabilityRanges(availability: AvailabilityRange[]): boolean {
  return availability.every((range) => {
    const startDate = new Date(range.start_date);
    const endDate = new Date(range.end_date);
    return (
      startDate < endDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())
    );
  });
}

/**
 * Create a new property
 */
export async function createProperty(
  input: CreatePropertyInput
): Promise<ServiceResponse<Property>> {
  try {
    const validationResult = propertySchema.safeParse(input);
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      };
    }

    // Validate image URLs
    if (input.images && input.images.length > 0) {
      if (!validateImageUrls(input.images)) {
        return {
          success: false,
          error:
            'Invalid image URLs. Images must be valid HTTP/HTTPS URLs ending with jpg, jpeg, png, gif, or webp',
        };
      }
    }

    // Validate amenities
    if (input.amenities && input.amenities.length > 0) {
      const amenitiesValidation = validateAmenities(input.amenities);
      if (!amenitiesValidation.valid) {
        return {
          success: false,
          error: 'Invalid amenities provided',
          details: {
            invalidAmenities: amenitiesValidation.invalidAmenities,
            allowedAmenities: ALLOWED_AMENITIES,
          },
        };
      }
    }

    // Validate availability ranges
    if (input.availability && input.availability.length > 0) {
      if (!validateAvailabilityRanges(input.availability)) {
        return {
          success: false,
          error:
            'Invalid availability ranges. Start date must be before end date and dates must be valid',
        };
      }
    }

    // Check if owner exists
    const { data: owner, error: ownerError } = await supabase
      .from('users')
      .select('id')
      .eq('id', input.owner_id)
      .single();

    if (ownerError || !owner) {
      return {
        success: false,
        error: 'Owner not found',
      };
    }

    // Insert property into database
    const { data: property, error: insertError } = await supabase
      .from('properties')
      .insert({
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return {
        success: false,
        error: 'Failed to create property',
        details: insertError,
      };
    }

    return {
      success: true,
      data: property as Property,
    };
  } catch (error) {
    console.error('Property creation error:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error,
    };
  }
}

/**
 * Get property by ID
 */
export async function getPropertyById(id: string): Promise<ServiceResponse<Property>> {
  try {
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return {
        success: false,
        error: 'Property not found',
        details: error,
      };
    }

    return {
      success: true,
      data: property as Property,
    };
  } catch (error) {
    console.error('Get property error:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error,
    };
  }
}

/**
 * Update property
 */
export async function updateProperty(
  id: string,
  input: UpdatePropertyInput
): Promise<ServiceResponse<Property>> {
  try {
    // Validate input using Zod schema
    const validationResult = updatePropertySchema.safeParse(input);
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      };
    }

    // Validate image URLs if provided
    if (input.images && input.images.length > 0) {
      if (!validateImageUrls(input.images)) {
        return {
          success: false,
          error:
            'Invalid image URLs. Images must be valid HTTP/HTTPS URLs ending with jpg, jpeg, png, gif, or webp',
        };
      }
    }

    // Validate amenities if provided
    if (input.amenities && input.amenities.length > 0) {
      const amenitiesValidation = validateAmenities(input.amenities);
      if (!amenitiesValidation.valid) {
        return {
          success: false,
          error: 'Invalid amenities provided',
          details: {
            invalidAmenities: amenitiesValidation.invalidAmenities,
            allowedAmenities: ALLOWED_AMENITIES,
          },
        };
      }
    }

    // Validate availability ranges if provided
    if (input.availability && input.availability.length > 0) {
      if (!validateAvailabilityRanges(input.availability)) {
        return {
          success: false,
          error:
            'Invalid availability ranges. Start date must be before end date and dates must be valid',
        };
      }
    }

    // Check if property exists
    const existingProperty = await getPropertyById(id);
    if (!existingProperty.success) {
      return existingProperty;
    }

    // Update property in database
    const { data: property, error: updateError } = await supabase
      .from('properties')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return {
        success: false,
        error: 'Failed to update property',
        details: updateError,
      };
    }

    return {
      success: true,
      data: property as Property,
    };
  } catch (error) {
    console.error('Property update error:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error,
    };
  }
}

/**
 * Delete property
 */
export async function deleteProperty(id: string): Promise<ServiceResponse<boolean>> {
  try {
    // Check if property exists
    const existingProperty = await getPropertyById(id);
    if (!existingProperty.success) {
      return {
        success: false,
        error: 'Property not found',
      };
    }

    const { error } = await supabase.from('properties').delete().eq('id', id);

    if (error) {
      console.error('Database delete error:', error);
      return {
        success: false,
        error: 'Failed to delete property',
        details: error,
      };
    }

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error('Property deletion error:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error,
    };
  }
}

/**
 * Get properties by owner
 */
export async function getPropertiesByOwner(
  ownerId: string,
  options: PropertySearchOptions = {}
): Promise<ServiceResponse<PropertyListResponse>> {
  try {
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = options;
    const offset = (page - 1) * limit;

    const query = supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('owner_id', ownerId)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: properties, error, count } = await query;

    if (error) {
      console.error('Database query error:', error);
      return {
        success: false,
        error: 'Failed to fetch properties',
        details: error,
      };
    }

    return {
      success: true,
      data: {
        properties: properties as Property[],
        total: count || 0,
        page,
        limit,
      },
    };
  } catch (error) {
    console.error('Get properties by owner error:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error,
    };
  }
}

/**
 * Search properties with filters
 */
export async function searchProperties(
  filters: PropertySearchFilters = {},
  options: PropertySearchOptions = {}
): Promise<ServiceResponse<PropertyListResponse>> {
  try {
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = options;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters.country) {
      query = query.ilike('country', `%${filters.country}%`);
    }
    if (filters.min_price !== undefined) {
      query = query.gte('price', filters.min_price);
    }
    if (filters.max_price !== undefined) {
      query = query.lte('price', filters.max_price);
    }
    if (filters.bedrooms !== undefined) {
      query = query.eq('bedrooms', filters.bedrooms);
    }
    if (filters.bathrooms !== undefined) {
      query = query.eq('bathrooms', filters.bathrooms);
    }
    if (filters.max_guests !== undefined) {
      query = query.gte('max_guests', filters.max_guests);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.amenities && filters.amenities.length > 0) {
      query = query.contains('amenities', filters.amenities);
    }

    const { data: properties, error, count } = await query;

    if (error) {
      console.error('Database search error:', error);
      return {
        success: false,
        error: 'Failed to search properties',
        details: error,
      };
    }

    return {
      success: true,
      data: {
        properties: properties as Property[],
        total: count || 0,
        page,
        limit,
      },
    };
  } catch (error) {
    console.error('Property search error:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error,
    };
  }
}

/**
 * Get allowed amenities list
 */
export function getAllowedAmenities(): string[] {
  return [...ALLOWED_AMENITIES];
}

/**
 * Update property availability
 */
export async function updatePropertyAvailability(
  id: string,
  availability: AvailabilityRange[]
): Promise<ServiceResponse<Property>> {
  try {
    if (!validateAvailabilityRanges(availability)) {
      return {
        success: false,
        error:
          'Invalid availability ranges. Start date must be before end date and dates must be valid',
      };
    }

    return await updateProperty(id, { availability });
  } catch (error) {
    console.error('Update availability error:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error,
    };
  }
}

/**
 * Update property status
 */
export async function updatePropertyStatus(
  id: string,
  status: 'available' | 'booked' | 'maintenance'
): Promise<ServiceResponse<Property>> {
  try {
    return await updateProperty(id, { status });
  } catch (error) {
    console.error('Update status error:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error,
    };
  }
}
