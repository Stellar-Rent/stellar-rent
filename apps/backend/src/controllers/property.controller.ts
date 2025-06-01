import type { Request, Response } from 'express';
import { z } from 'zod';
import { deleteFromSupabaseStorage, uploadToSupabaseStorage } from '../config/supabase-storage';
import {
  type PropertySearchFilters,
  type PropertySearchOptions,
  createProperty,
  deleteProperty,
  getAllowedAmenities,
  getPropertiesByOwner,
  getPropertyById,
  searchProperties,
  updateProperty,
  updatePropertyAvailability,
  updatePropertyStatus,
} from '../services/property.service';
import {
  availabilityRangeSchema,
  propertySchema,
  searchPropertiesQuerySchema,
  updatePropertySchema,
} from '../types/property.types';

const createPropertyRequestSchema = propertySchema;

const updatePropertyRequestSchema = updatePropertySchema;

const updateAvailabilityRequestSchema = z.object({
  availability: z.array(availabilityRangeSchema),
});

const updateStatusRequestSchema = z.object({
  status: z.enum(['available', 'booked', 'maintenance']),
});

const propertyIdParamSchema = z.object({
  id: z.string().uuid('Invalid property ID format'),
});

const ownerIdParamSchema = z.object({
  ownerId: z.string().uuid('Invalid owner ID format'),
});

// Response formatting utilities
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

function formatSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

function formatErrorResponse(error: string, details?: unknown): ApiResponse {
  return {
    success: false,
    error,
    details,
  };
}

async function coordinateImageUploads(
  images: string[],
  propertyId: string
): Promise<{ success: boolean; uploadedUrls?: string[]; error?: string }> {
  try {
    const uploadPromises = images.map(async (image, index) => {
      const uploadedUrl = await uploadToSupabaseStorage(image, propertyId, index);
      return uploadedUrl;
    });

    // Wait for all uploads to complete
    const uploadedUrls = await Promise.all(uploadPromises);

    const failedUploads = uploadedUrls.filter((url) => url === null);
    if (failedUploads.length > 0) {
      // Clean up successful uploads
      const successfulUrls = uploadedUrls.filter((url) => url !== null) as string[];
      await Promise.all(successfulUrls.map((url) => deleteFromSupabaseStorage(url)));

      return {
        success: false,
        error: `Failed to upload ${failedUploads.length} image(s)`,
      };
    }

    return {
      success: true,
      uploadedUrls: uploadedUrls as string[],
    };
  } catch (error) {
    console.error('Image upload coordination error:', error);
    return {
      success: false,
      error: 'Image upload failed due to an unexpected error',
    };
  }
}

/**
 * Create a new property
 */
export async function createPropertyController(req: Request, res: Response): Promise<void> {
  try {
    const validationResult = createPropertyRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      res
        .status(400)
        .json(formatErrorResponse('Invalid request data', validationResult.error.errors));
      return;
    }

    const propertyData = validationResult.data;
    const tempPropertyId = crypto.randomUUID();

    // Coordinate image uploads if images are provided
    if (propertyData.images && propertyData.images.length > 0) {
      const imageUploadResult = await coordinateImageUploads(propertyData.images, tempPropertyId);
      if (!imageUploadResult.success) {
        res.status(400).json(formatErrorResponse(imageUploadResult.error || 'Image upload failed'));
        return;
      }
      propertyData.images = imageUploadResult.uploadedUrls || [];
    }

    const propertyInput = {
      ...propertyData,
      latitude: propertyData.latitude === undefined ? null : propertyData.latitude,
      longitude: propertyData.longitude === undefined ? null : propertyData.longitude,
      cancellation_policy:
        propertyData.cancellation_policy === undefined ? null : propertyData.cancellation_policy,
      property_token:
        propertyData.property_token === undefined ? null : propertyData.property_token,
    };

    // Create property using service
    const result = await createProperty(propertyInput);

    if (!result.success) {
      const statusCode =
        result.error === 'Owner not found' ? 404 : result.error === 'Validation failed' ? 400 : 500;
      res
        .status(statusCode)
        .json(formatErrorResponse(result.error || 'Unknown error', result.details));
      return;
    }

    res.status(201).json(formatSuccessResponse(result.data, 'Property created successfully'));
  } catch (error) {
    console.error('Create property controller error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
}

/**
 * Update property
 */
export async function updatePropertyController(req: Request, res: Response): Promise<void> {
  try {
    const paramValidation = propertyIdParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      res
        .status(400)
        .json(formatErrorResponse('Invalid property ID', paramValidation.error.errors));
      return;
    }
    const bodyValidation = updatePropertyRequestSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      res
        .status(400)
        .json(formatErrorResponse('Invalid request data', bodyValidation.error.errors));
      return;
    }

    const { id } = paramValidation.data;
    const updateData = bodyValidation.data;

    const existingProperty = await getPropertyById(id);
    if (!existingProperty.success) {
      res.status(404).json(formatErrorResponse('Property not found'));
      return;
    }

    if (updateData.images && updateData.images.length > 0) {
      const newImages = updateData.images.filter((img) => !img.includes('supabase'));

      if (newImages.length > 0) {
        const imageUploadResult = await coordinateImageUploads(newImages, id);
        if (!imageUploadResult.success) {
          res
            .status(400)
            .json(formatErrorResponse(imageUploadResult.error || 'Image upload failed'));
          return;
        }

        updateData.images = updateData.images
          .map((img) => {
            if (newImages.includes(img)) {
              const index = newImages.indexOf(img);
              const uploadedUrl = imageUploadResult.uploadedUrls?.[index];
              if (!uploadedUrl) {
                throw new Error(`Failed to get uploaded URL for image at index ${index}`);
              }
              return uploadedUrl;
            }
            return img;
          })
          .filter((img): img is string => img !== undefined);
      }

      const existingImages = existingProperty.data?.images || [];
      const removedImages = existingImages.filter(
        (img) => !(updateData.images ?? []).includes(img) && img.includes('supabase')
      );

      // Delete removed images from Supabase Storage
      await Promise.all(removedImages.map((img) => deleteFromSupabaseStorage(img)));
    }
    const updateInput = {
      ...updateData,
      latitude: updateData.latitude === undefined ? null : updateData.latitude,
      longitude: updateData.longitude === undefined ? null : updateData.longitude,
      cancellation_policy:
        updateData.cancellation_policy === undefined ? null : updateData.cancellation_policy,
      property_token: updateData.property_token === undefined ? null : updateData.property_token,
    };

    // Update property using service
    const result = await updateProperty(id, updateInput);

    if (!result.success) {
      const statusCode =
        result.error === 'Property not found'
          ? 404
          : result.error === 'Validation failed'
            ? 400
            : 500;
      res
        .status(statusCode)
        .json(formatErrorResponse(result.error || 'Unknown error', result.details));
      return;
    }

    res.status(200).json(formatSuccessResponse(result.data, 'Property updated successfully'));
  } catch (error) {
    console.error('Update property controller error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
}

/**
 * Delete property
 */
export async function deletePropertyController(req: Request, res: Response): Promise<void> {
  try {
    // Validate request parameters
    const paramValidation = propertyIdParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      res
        .status(400)
        .json(formatErrorResponse('Invalid property ID', paramValidation.error.errors));
      return;
    }

    const { id } = paramValidation.data;

    // Get property to delete its images
    const existingProperty = await getPropertyById(id);
    if (!existingProperty.success) {
      res.status(404).json(formatErrorResponse('Property not found'));
      return;
    }

    // Delete images from Cloudinary
    if (existingProperty.data?.images && existingProperty.data.images.length > 0) {
      await Promise.all(
        existingProperty.data.images
          .filter((img) => img.includes('supabase'))
          .map((img) => deleteFromSupabaseStorage(img))
      );
    }

    // Delete property using service
    const result = await deleteProperty(id);

    if (!result.success) {
      const statusCode = result.error === 'Property not found' ? 404 : 500;
      res
        .status(statusCode)
        .json(formatErrorResponse(result.error || 'Unknown error', result.details));
      return;
    }

    res.status(200).json(formatSuccessResponse(null, 'Property deleted successfully'));
  } catch (error) {
    console.error('Delete property controller error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
}

/**
 * Get property by ID
 */
export async function getPropertyByIdController(req: Request, res: Response): Promise<void> {
  try {
    const paramValidation = propertyIdParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      res
        .status(400)
        .json(formatErrorResponse('Invalid property ID', paramValidation.error.errors));
      return;
    }

    const { id } = paramValidation.data;

    // Get property using service
    const result = await getPropertyById(id);

    if (!result.success) {
      const statusCode = result.error === 'Property not found' ? 404 : 500;
      res
        .status(statusCode)
        .json(formatErrorResponse(result.error || 'Unknown error', result.details));
      return;
    }

    res.status(200).json(formatSuccessResponse(result.data));
  } catch (error) {
    console.error('Get property controller error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
}

/**
 * Get properties by owner
 */
export async function getPropertiesByOwnerController(req: Request, res: Response): Promise<void> {
  try {
    const paramValidation = ownerIdParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      res.status(400).json(formatErrorResponse('Invalid owner ID', paramValidation.error.errors));
      return;
    }
    const queryValidation = searchPropertiesQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      res
        .status(400)
        .json(formatErrorResponse('Invalid query parameters', queryValidation.error.errors));
      return;
    }

    const { ownerId } = paramValidation.data;
    const { page, limit, sort_by, sort_order } = queryValidation.data;

    const options: PropertySearchOptions = {
      page,
      limit,
      sort_by,
      sort_order,
    };

    // Get properties using service
    const result = await getPropertiesByOwner(ownerId, options);

    if (!result.success) {
      res.status(500).json(formatErrorResponse(result.error || 'Unknown error', result.details));
      return;
    }

    res.status(200).json(formatSuccessResponse(result.data));
  } catch (error) {
    console.error('Get properties by owner controller error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
}

/**
 * Search properties
 */
export async function searchPropertiesController(req: Request, res: Response): Promise<void> {
  try {
    const queryValidation = searchPropertiesQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      res
        .status(400)
        .json(formatErrorResponse('Invalid query parameters', queryValidation.error.errors));
      return;
    }

    const {
      city,
      country,
      min_price,
      max_price,
      bedrooms,
      bathrooms,
      max_guests,
      amenities,
      status,
      page,
      limit,
      sort_by,
      sort_order,
    } = queryValidation.data;

    const filters: PropertySearchFilters = {
      city,
      country,
      min_price,
      max_price,
      bedrooms,
      bathrooms,
      max_guests,
      amenities,
      status,
    };

    const options: PropertySearchOptions = {
      page,
      limit,
      sort_by,
      sort_order,
    };

    // Search properties using service
    const result = await searchProperties(filters, options);

    if (!result.success) {
      res.status(500).json(formatErrorResponse(result.error || 'Unknown error', result.details));
      return;
    }

    res.status(200).json(formatSuccessResponse(result.data));
  } catch (error) {
    console.error('Search properties controller error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
}

/**
 * Get allowed amenities
 */
export async function getAllowedAmenitiesController(_req: Request, res: Response): Promise<void> {
  try {
    const amenities = getAllowedAmenities();
    res.status(200).json(formatSuccessResponse(amenities));
  } catch (error) {
    console.error('Get allowed amenities controller error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
}

/**
 * Update property availability
 */
export async function updatePropertyAvailabilityController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const paramValidation = propertyIdParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      res
        .status(400)
        .json(formatErrorResponse('Invalid property ID', paramValidation.error.errors));
      return;
    }
    const bodyValidation = updateAvailabilityRequestSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      res
        .status(400)
        .json(formatErrorResponse('Invalid availability data', bodyValidation.error.errors));
      return;
    }

    const { id } = paramValidation.data;
    const { availability } = bodyValidation.data;

    // Update availability using service
    const result = await updatePropertyAvailability(id, availability);

    if (!result.success) {
      const statusCode =
        result.error === 'Property not found'
          ? 404
          : result.error?.includes('Invalid availability')
            ? 400
            : 500;
      res
        .status(statusCode)
        .json(formatErrorResponse(result.error || 'Unknown error', result.details));
      return;
    }

    res
      .status(200)
      .json(formatSuccessResponse(result.data, 'Property availability updated successfully'));
  } catch (error) {
    console.error('Update property availability controller error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
}

/**
 * Update property status
 */
export async function updatePropertyStatusController(req: Request, res: Response): Promise<void> {
  try {
    const paramValidation = propertyIdParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      res
        .status(400)
        .json(formatErrorResponse('Invalid property ID', paramValidation.error.errors));
      return;
    }
    const bodyValidation = updateStatusRequestSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      res.status(400).json(formatErrorResponse('Invalid status data', bodyValidation.error.errors));
      return;
    }

    const { id } = paramValidation.data;
    const { status } = bodyValidation.data;

    // Update status using service
    const result = await updatePropertyStatus(id, status);

    if (!result.success) {
      const statusCode = result.error === 'Property not found' ? 404 : 500;
      res
        .status(statusCode)
        .json(formatErrorResponse(result.error || 'Unknown error', result.details));
      return;
    }

    res
      .status(200)
      .json(formatSuccessResponse(result.data, 'Property status updated successfully'));
  } catch (error) {
    console.error('Update property status controller error:', error);
    res.status(500).json(formatErrorResponse('Internal server error'));
  }
}
