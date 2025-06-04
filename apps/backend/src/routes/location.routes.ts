import { Router } from 'express';
import {
  getLocationSuggestions,
  getPopularLocations,
  locationHealthCheck,
} from '../controllers/location.controller';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiting to all location routes
router.use(rateLimiter);

/**
 * @route GET /api/locations/autocomplete
 * @desc Get location suggestions for autocomplete
 * @access Public
 * @param {string} query - Search query (required, min 1 char, max 100 chars)
 * @param {number} limit - Maximum results (optional, default 20, max 50)
 * @example /api/locations/autocomplete?query=Buenos&limit=10
 */
router.get('/autocomplete', getLocationSuggestions);

/**
 * @route GET /api/locations/popular
 * @desc Get popular locations based on property frequency
 * @access Public
 * @param {number} limit - Maximum results (optional, default 10, max 20)
 * @example /api/locations/popular?limit=5
 */
router.get('/popular', getPopularLocations);

/**
 * @route GET /api/locations/health
 * @desc Health check for location service
 * @access Public
 */
router.get('/health', locationHealthCheck);

export default router;
