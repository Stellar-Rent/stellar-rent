/**
 * MODIFICATION SUMMARY - PropertyListingContract Integration
 *
 * Changed: Added blockchain synchronization logic for property CRUD operations
 * Reason: OnlyDust task requirement for PropertyListingContract integration with data integrity verification
 * Impact: Properties now automatically sync with Stellar blockchain when created/updated, enabling tamper-proof verification
 * Dependencies: Added propertyListingContract.ts module for blockchain interactions
 * Breaking Changes: Added 'warning' property to ServiceResponse interface for blockchain operation failures
 *
 * Related Files:
 * - apps/backend/src/blockchain/propertyListingContract.ts (new blockchain client)
 * - apps/backend/src/controllers/property.controller.ts (new verification endpoint)
 * - apps/backend/src/routes/property.route.ts (new verification route)
 * - apps/web/src/components/features/properties/PropertyDetail.tsx (blockchain verification UI)
 * - apps/web/src/app/dashboard/host-dashboard/page.tsx (status badge integration)
 *
 * GitHub Issue: https://github.com/Stellar-Rent/stellar-rent/issues/99
 */

import * as pLimit from 'p-limit';
import { checkBookingAvailability } from '../blockchain/bookingContract';
import {
  createPropertyListing,
  getPropertyListing,
  type PropertyListing,
  propertyToHashData,
  updatePropertyListing,
  updatePropertyStatus,
  verifyPropertyIntegrity,
} from '../blockchain/propertyListingContract';
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

// Use Number.isNaN directly (available in modern Node.js)
const isNaNValue = Number.isNaN;

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

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  warning?: string;
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
  // Advanced filtering options
  property_type?: string;
  instant_book?: boolean;
  free_cancellation?: boolean;
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  search_text?: string; // for full-text search
}

export interface PropertySearchOptions {
  page?: number;
  limit?: number;
  sort_by?: 'price' | 'created_at' | 'title' | 'relevance' | 'distance';
  sort_order?: 'asc' | 'desc';
  include_count?: boolean;
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
  const invalidAmenities = amenities.filter((amenity) => !ALLOWED_AMENITIES.includes(amenity));

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
      startDate < endDate && !isNaNValue(startDate.getTime()) && !isNaNValue(endDate.getTime())
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

    // Insert property into database first
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

    // Invalidate related caches
    await cacheService.invalidatePropertyCaches(property.id);

    // Create blockchain listing
    try {
      const propertyHashData = propertyToHashData(property as Property);
      const blockchainListing = await createPropertyListing(
        property.id,
        propertyHashData,
        input.ownerId // Use owner ID as blockchain address for now
      );

      // Update property with blockchain hash
      const { data: updatedProperty, error: updateError } = await supabase
        .from('properties')
        .update({
          property_token: blockchainListing.data_hash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', property.id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update property with blockchain hash:', updateError);
        // Property was created but blockchain integration failed
        return {
          success: true,
          data: property as Property,
          warning: 'Property created but blockchain integration failed',
        };
      }

      return {
        success: true,
        data: updatedProperty as Property,
      };
    } catch (blockchainError) {
      console.error('Blockchain listing creation failed:', blockchainError);
      // Property was created but blockchain integration failed
      return {
        success: true,
        data: property as Property,
        warning: 'Property created but blockchain integration failed',
      };
    }
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
      .select(`
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
      `)
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

    // Invalidate related caches
    await cacheService.invalidatePropertyCaches(id);

    // Update blockchain listing if property data changed
    try {
      const updatedProperty = property as Property;
      const propertyHashData = propertyToHashData(updatedProperty);

      // Check if this is a status-only update
      if (input.status && Object.keys(input).length === 1) {
        // Status-only update
        await updatePropertyStatus(
          id,
          input.status as 'Available' | 'Booked' | 'Maintenance' | 'Inactive',
          updatedProperty.ownerId
        );
      } else {
        // Full property update
        const blockchainListing = await updatePropertyListing(
          id,
          propertyHashData,
          updatedProperty.ownerId
        );

        // Update property with new blockchain hash
        const { error: hashUpdateError } = await supabase
          .from('properties')
          .update({
            property_token: blockchainListing.data_hash,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (hashUpdateError) {
          console.error('Failed to update property hash:', hashUpdateError);
        }
      }
    } catch (blockchainError) {
      console.error('Blockchain update failed:', blockchainError);
      // Continue with database update even if blockchain fails
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

    const formatted = (data || []).map(
      (property: {
        id: string;
        title: string;
        price: number;
        city: string;
        country: string;
        images: string[] | null;
        availability: unknown;
      }) => ({
        ...property,
        image: property.images?.[0] ?? null,
        location: {
          city: property.city,
          country: property.country,
        },
      })
    );

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

    // Invalidate related caches
    await cacheService.invalidatePropertyCaches(id);

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
 * Verify property data integrity with blockchain
 */
export async function verifyPropertyWithBlockchain(
  id: string
): Promise<ServiceResponse<{ isValid: boolean; blockchainData?: PropertyListing }>> {
  try {
    // Get property from database
    const propertyResult = await getPropertyById(id);
    if (!propertyResult.success) {
      return {
        success: false,
        error: 'Property not found',
      };
    }

    // Get property from blockchain
    const blockchainListing = await getPropertyListing(id);
    if (!blockchainListing) {
      return {
        success: true,
        data: {
          isValid: false,
          blockchainData: undefined,
        },
      };
    }

    // Verify integrity
    if (!propertyResult.data) {
      return {
        success: false,
        error: 'Property data not found',
      };
    }

    const propertyHashData = propertyToHashData(propertyResult.data);
    const isValid = verifyPropertyIntegrity(propertyHashData, blockchainListing.data_hash);

    return {
      success: true,
      data: {
        isValid,
        blockchainData: blockchainListing,
      },
    };
  } catch (error) {
    console.error('Property verification error:', error);
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
 * Search properties with filters and advanced optimizations
 */
export async function searchProperties(
  filters: PropertySearchFilters = {},
  options: PropertySearchOptions = {},
  userId?: string
): Promise<ServiceResponse<PropertyListResponse>> {
  const startTime = Date.now();

  try {
    const {
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'desc',
      include_count = true,
    } = options;
    const offset = (page - 1) * limit;

    // Generate cache key
    const cacheKey = cacheService.generateSearchKey(filters, options);

    // Check cache first
    const cachedResult = await cacheService.get<PropertyListResponse>(cacheKey);
    if (cachedResult) {
      const responseTime = Date.now() - startTime;

      // Log analytics for cached result
      await cacheService.cacheSearchAnalytics(cacheKey, cachedResult.total, responseTime, userId);

      return {
        success: true,
        data: cachedResult,
      };
    }

    // Build optimized query with proper indexing
    let query = supabase
      .from('properties')
      .select('*', { count: include_count ? 'exact' : undefined });

    // Apply filters in optimal order (most selective first)
    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'available'); // Default to available
    }

    // Location filtering (simplified for now, can optimize later)
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters.country) {
      query = query.ilike('country', `%${filters.country}%`);
    }

    // Text search (simplified)
    if (filters.search_text) {
      query = query.or(
        `title.ilike.%${filters.search_text}%,description.ilike.%${filters.search_text}%`
      );
    }

    // Price range filtering
    if (filters.min_price !== undefined) {
      query = query.gte('price', filters.min_price);
    }
    if (filters.max_price !== undefined) {
      query = query.lte('price', filters.max_price);
    }

    // Capacity filtering
    if (filters.max_guests !== undefined) {
      query = query.gte('max_guests', filters.max_guests);
    }
    if (filters.bedrooms !== undefined) {
      query = query.eq('bedrooms', filters.bedrooms);
    }
    if (filters.bathrooms !== undefined) {
      query = query.eq('bathrooms', filters.bathrooms);
    }

    // Amenities filtering (using GIN index)
    if (filters.amenities && filters.amenities.length > 0) {
      query = query.contains('amenities', filters.amenities);
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: properties, error, count } = await query;

    if (error) {
      console.error('Database search error:', error);
      return {
        success: false,
        error: 'Failed to search properties',
        details: error,
      };
    }

    let filteredProperties = properties as Property[];

    // Date availability filtering (expensive operation, do last)
    if (filters.from && filters.to && filteredProperties.length > 0) {
      const fromDate = new Date(filters.from);
      const toDate = new Date(filters.to);

      if (isNaNValue(fromDate.getTime()) || isNaNValue(toDate.getTime())) {
        return {
          success: false,
          error: 'Invalid date format for from or to',
        };
      }

      // Limit concurrency for blockchain calls
      const concurrencyLimit = pLimit(5);

      try {
        const availabilityChecks = await Promise.all(
          filteredProperties.map((property) =>
            concurrencyLimit(async () => {
              try {
                const isAvailable = await checkBookingAvailability(
                  property.id,
                  fromDate.toISOString(),
                  toDate.toISOString()
                );
                return isAvailable ? property : null;
              } catch (error) {
                console.warn(`Availability check failed for property ${property.id}:`, error);
                // Include property if blockchain check fails (graceful degradation)
                return property;
              }
            })
          )
        );

        filteredProperties = availabilityChecks.filter(Boolean) as Property[];
      } catch (error) {
        console.error('Availability checking failed:', error);
        // Continue without availability filtering if blockchain is down
      }
    }

    const result: PropertyListResponse = {
      properties: filteredProperties,
      total: count || filteredProperties.length,
      page,
      limit,
    };

    // Cache successful results for 2 minutes (shorter for real-time data)
    await cacheService.set(cacheKey, result, 120);

    const responseTime = Date.now() - startTime;

    // Log search analytics
    await cacheService.cacheSearchAnalytics(cacheKey, result.total, responseTime, userId);

    // Log slow queries for optimization
    if (responseTime > 2000) {
      console.warn('Slow search query detected:', {
        filters,
        options,
        responseTime,
        resultCount: result.total,
      });
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Property search error:', error);

    const responseTime = Date.now() - startTime;
    const cacheKey = cacheService.generateSearchKey(filters, options);

    // Log failed search analytics
    await cacheService.cacheSearchAnalytics(cacheKey, 0, responseTime, userId);

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
