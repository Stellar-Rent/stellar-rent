import pLimit from 'p-limit';
import { checkBookingAvailability } from '../blockchain/bookingContract';
import { supabase } from '../config/supabase';
import type {
  AvailabilityRange,
  AvailabilityRangeInput,
  CreatePropertyInput,
  FeaturedProperty,
  Property,
  UpdatePropertyInput,
} from '../types/property.types';
// import{ checkB }
import { propertySchema, updatePropertySchema } from '../types/property.types';
import { cacheService } from './cache.service';

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
  from?: string;
  to?: string;
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

function validateAmenities(amenities: string[]): {
  valid: boolean;
  invalidAmenities: string[];
} {
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
      const mappedAvailability = input.availability.map((range: AvailabilityRangeInput) => ({
        start_date: (range.start_date ?? range.from) || '',
        end_date: (range.end_date ?? range.to) || '',
        is_available: range.is_available ?? true,
      }));
      if (!validateAvailabilityRanges(mappedAvailability)) {
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
      .eq('id', input.ownerId)
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
 * @param id - The unique identifier of the property
 * @returns A promise that resolves to a ServiceResponse containing the property data
 */
export async function getPropertyById(id: string): Promise<ServiceResponse<Property>> {
  try {
    const { data: property, error } = await supabase
      .from('properties')
      .select(
        `
        id,
        title,
        description,
        price,
        address,
        city,
        country,
        latitude,
        longitude,
        amenities,
        images,
        bedrooms,
        bathrooms,
        max_guests,
        owner_id,
        status,
        availability,
        security_deposit,
        cancellation_policy,
        created_at,
        updated_at
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      return {
        success: false,
        error: 'Property not found',
        details: error,
      };
    }

    // Transform the flat structure into the expected Property interface
    const formattedProperty: Property = {
      id: property.id,
      title: property.title,
      description: property.description,
      price: property.price,
      location: {
        address: property.address,
        city: property.city,
        country: property.country,
        coordinates:
          property.latitude && property.longitude
            ? { latitude: property.latitude, longitude: property.longitude }
            : undefined,
      },
      amenities: property.amenities || [],
      images: property.images || [],
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      maxGuests: property.max_guests,
      ownerId: property.owner_id,
      status: property.status as 'available' | 'booked' | 'maintenance',
      availability:
        property.availability?.map(
          (range: {
            from?: string;
            to?: string;
            start_date?: string;
            end_date?: string;
            is_available?: boolean;
          }) => ({
            from: range.start_date || range.from,
            to: range.end_date || range.to,
          })
        ) || [],
      securityDeposit: property.security_deposit,
      cancellationPolicy: property.cancellation_policy,
      createdAt: property.created_at,
      updatedAt: property.updated_at,
    };

    return {
      success: true,
      data: formattedProperty,
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
      const mappedAvailability = input.availability.map((range: AvailabilityRangeInput) => ({
        start_date: (range.start_date ?? range.from) || '',
        end_date: (range.end_date ?? range.to) || '',
        is_available: range.is_available ?? true,
      }));
      if (!validateAvailabilityRanges(mappedAvailability)) {
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
 * get getFeaturedProperties property
 */
export async function getFeaturedProperties(): Promise<ServiceResponse<FeaturedProperty[]>> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('id, title, price, city, country, images, availability')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      return {
        success: false,
        error: 'Failed to fetch featured properties',
        details: error,
      };
    }

    const formatted = (data || []).map((property) => ({
      ...property,
      image: property.images?.[0] ?? null,
      location: {
        city: property.city,
        country: property.country,
      },
    }));

    return {
      success: true,
      data: formatted,
    };
  } catch (err) {
    console.error('getFeaturedProperties error:', err);
    return {
      success: false,
      error: 'Internal server error',
      details: err,
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

    const { data: properties, error } = await query;

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
 * Search properties with filters (optimized with caching)
 */
export async function searchProperties(
  filters: PropertySearchFilters = {},
  options: PropertySearchOptions = {}
): Promise<ServiceResponse<PropertyListResponse>> {
  try {
    const startTime = Date.now();

    // Generate cache key
    const cacheKey = `search:${JSON.stringify(filters)}:${JSON.stringify(options)}`;

    // Try to get from cache first
    const cachedResult = await cacheService.getCachedSearchResults(
      cacheKey,
      filters,
      options.page || 1,
      options.limit || 10
    );

    if (cachedResult) {
      console.log(`📖 Cache hit for search: ${cacheKey}`);
      return {
        success: true,
        data: cachedResult as PropertyListResponse,
      };
    }

    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = options;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('status', 'available')
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply optimized filters using indexes
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
    if (filters.amenities && filters.amenities.length > 0) {
      query = query.contains('amenities', filters.amenities);
    }

    const { data: properties, error } = await query;

    if (error) {
      console.error('Database search error:', error);
      return {
        success: false,
        error: 'Failed to search properties',
        details: error,
      };
    }

    let filteredProperties = properties as Property[];

    // Apply availability filtering if dates provided
    if (filters.from && filters.to) {
      const fromDate = new Date(filters.from);
      const toDate = new Date(filters.to);

      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        return {
          success: false,
          error: 'Invalid date format for from or to',
        };
      }

      // Use optimized availability checking with database function
      const availabilityLimit = pLimit(5); // Reduced concurrency for better performance

      const checked = await Promise.all(
        filteredProperties.map((property) =>
          availabilityLimit(async () => {
            try {
              // Use database function for availability check
              const { data: isAvailable, error: availabilityError } = await supabase.rpc(
                'is_property_available',
                {
                  property_id: property.id,
                  check_in_date: fromDate.toISOString().split('T')[0],
                  check_out_date: toDate.toISOString().split('T')[0],
                }
              );

              if (availabilityError) {
                console.error(
                  `Availability check error for property ${property.id}:`,
                  availabilityError
                );
                return property; // Include property if check fails
              }

              return isAvailable ? property : null;
            } catch (e) {
              console.error(`Error checking availability for property ${property.id}:`, e);
              return property; // Include property if check fails
            }
          })
        )
      );
      filteredProperties = checked.filter(Boolean) as Property[];
    }

    const result: PropertyListResponse = {
      properties: filteredProperties,
      total: filteredProperties.length,
      page,
      limit,
    };

    // Cache the result
    await cacheService.cacheSearchResults(cacheKey, filters, page, limit, result);

    const searchTime = Date.now() - startTime;
    console.log(`🔍 Search completed in ${searchTime}ms (${filteredProperties.length} results)`);

    return {
      success: true,
      data: result,
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

    const mappedAvailability = availability.map((range: AvailabilityRangeInput) => ({
      from: (range.start_date ?? range.from) || '',
      to: (range.end_date ?? range.to) || '',
    }));
    return await updateProperty(id, { availability: mappedAvailability });
  } catch (error) {
    console.error('Update property availability error:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error,
    };
  }
}
