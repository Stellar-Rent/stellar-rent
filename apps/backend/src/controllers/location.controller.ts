import type { Request, Response } from 'express';
import { z } from 'zod';
import { LocationService, locationService } from '../services/location.service';
import {
  formatErrorResponse,
  formatSuccessResponse,
  locationQuerySchema,
  paginationSchema,
} from '../types/shared.types';

export class LocationController {
  private locationService: LocationService;

  constructor(locationService?: LocationService) {
    this.locationService = locationService || new LocationService();
  }

  /**
   * Get location suggestions for autocomplete
   * GET /api/locations/autocomplete?query=string&limit=number
   */
  async getLocationSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = locationQuerySchema.merge(paginationSchema).safeParse(req.query);

      if (!validationResult.success) {
        res.status(400).json(
          formatErrorResponse(
            'Validation error',
            validationResult.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            }))
          )
        );
        return;
      }

      const { query, limit } = validationResult.data;
      const result = await this.locationService.getLocationSuggestions(query, limit);

      if (!result.success) {
        const statusCode = result.error?.includes('Failed to fetch') ? 503 : 500;
        res.status(statusCode).json(formatErrorResponse(result.error || 'Unknown error'));
        return;
      }

      res.status(200).json(formatSuccessResponse(result.data));
    } catch (error) {
      console.error('Location controller error:', error);
      res.status(500).json(formatErrorResponse('Internal server error'));
    }
  }

  /**
   * Get popular locations
   * GET /api/locations/popular?limit=number
   */
  async getPopularLocations(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = paginationSchema.safeParse(req.query);

      if (!validationResult.success) {
        res.status(400).json(
          formatErrorResponse(
            'Validation error',
            validationResult.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            }))
          )
        );
        return;
      }

      const { limit } = validationResult.data;
      const result = await this.locationService.getPopularLocations(limit);

      if (!result.success) {
        const statusCode = result.error?.includes('Failed to fetch') ? 503 : 500;
        res.status(statusCode).json(formatErrorResponse(result.error || 'Unknown error'));
        return;
      }

      res.status(200).json(formatSuccessResponse(result.data));
    } catch (error) {
      console.error('Popular locations controller error:', error);
      res.status(500).json(formatErrorResponse('Internal server error'));
    }
  }

  /**
   * Health check for location service
   * GET /api/locations/health
   */
  async healthCheck(_req: Request, res: Response): Promise<void> {
    try {
      const result = await this.locationService.getPopularLocations(1);

      if (result.success) {
        res.status(200).json({
          status: 'healthy',
          service: 'location-service',
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          status: 'unhealthy',
          service: 'location-service',
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (_error) {
      res.status(503).json({
        status: 'unhealthy',
        service: 'location-service',
        error: 'Service unavailable',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Export singleton instance
export const locationController = new LocationController(locationService);

// Export individual controller methods for route binding
export const getLocationSuggestions =
  locationController.getLocationSuggestions.bind(locationController);
export const getPopularLocations = locationController.getPopularLocations.bind(locationController);
export const locationHealthCheck = locationController.healthCheck.bind(locationController);
