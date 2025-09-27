import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import type {
  LocationAutocompleteResponse,
  LocationServiceResponse,
  LocationSuggestion,
} from '../types/location.types';
import { cacheService } from './cache.service';

export class LocationService {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || supabase;
  }

  /**
   * Get location suggestions based on user query
   * @param query - Search query string
   * @param limit - Maximum number of results to return (default: 20)
   * @returns Promise with location suggestions
   */
  async getLocationSuggestions(
    query: string,
    limit = 20
  ): Promise<LocationServiceResponse<LocationAutocompleteResponse>> {
    try {
      console.time('location-suggestions-query');

      // Sanitize query for database search
      const sanitizedQuery = this.sanitizeQuery(query);

      if (!sanitizedQuery) {
        return {
          success: true,
          data: {
            suggestions: [],
            total: 0,
            query,
          },
        };
      }

      // Check cache first
      console.time('location-cache-check');
      const cachedResult = await cacheService.getCachedLocationSuggestions(sanitizedQuery, limit);
      console.timeEnd('location-cache-check');

      if (cachedResult) {
        console.timeEnd('location-suggestions-query');
        return {
          success: true,
          data: cachedResult,
        };
      }

      // TODO: PERFORMANCE ISSUE - This query scans all properties without proper indexing
      // TODO: Missing composite index on (status, city, country) for optimal performance
      // TODO: Consider using full-text search with GIN indexes for better ILIKE performance
      // TODO: The OR condition with ILIKE is expensive - consider separate queries or FTS
      console.time('location-db-query');
      const { data, error } = await this.supabase
        .from('properties')
        .select('city, country')
        .or(`city.ilike.${sanitizedQuery}%,country.ilike.${sanitizedQuery}%`)
        .eq('status', 'available') // Only include available properties
        .order('city', { ascending: true })
        .limit(limit * 2); // Get more results to account for deduplication
      console.timeEnd('location-db-query');

      if (error) {
        console.error('Database error in location service:', error);
        return {
          success: false,
          error: 'Failed to fetch location suggestions',
          details: error,
        };
      }

      if (!data || data.length === 0) {
        return {
          success: true,
          data: {
            suggestions: [],
            total: 0,
            query,
          },
        };
      }

      // TODO: PERFORMANCE ISSUE - Client-side deduplication is inefficient
      // TODO: Consider using DISTINCT in SQL query or GROUP BY for better performance
      console.time('location-processing');
      const suggestions = this.processLocationResults(data, sanitizedQuery, limit);
      console.timeEnd('location-processing');

      const result = {
        suggestions,
        total: suggestions.length,
        query,
      };

      // Cache the result
      console.time('location-cache-set');
      await cacheService.cacheLocationSuggestions(sanitizedQuery, limit, result, 60);
      console.timeEnd('location-cache-set');

      console.timeEnd('location-suggestions-query');
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Location service error:', error);
      console.timeEnd('location-suggestions-query');
      return {
        success: false,
        error: 'Internal server error',
        details: error,
      };
    }
  }

  /**
   * Sanitize query string to prevent injection and normalize input
   * @param query - Raw query string
   * @returns Sanitized query string
   */
  private sanitizeQuery(query: string): string {
    return query
      .trim()
      .toLowerCase()
      .replace(/[^\w\s\-'.,áéíóúñüÁÉÍÓÚÑÜ]/g, '') // Remove special characters except allowed ones
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 100); // Limit length
  }

  /**
   * Process raw database results into structured suggestions
   * @param data - Raw database results
   * @param query - Original search query
   * @param limit - Maximum number of results
   * @returns Processed location suggestions
   */
  private processLocationResults(
    data: Array<{ city: string; country: string }>,
    query: string,
    limit: number
  ): LocationSuggestion[] {
    const uniqueLocations = new Map<string, LocationSuggestion>();
    const queryLower = query.toLowerCase();

    for (const location of data) {
      const { city, country } = location;
      const key = `${city.toLowerCase()}-${country.toLowerCase()}`;

      if (uniqueLocations.has(key)) {
        continue;
      }

      // Determine match type
      const cityMatches = city.toLowerCase().startsWith(queryLower);
      const countryMatches = country.toLowerCase().startsWith(queryLower);

      let matchType: 'city' | 'country' | 'both';
      if (cityMatches && countryMatches) {
        matchType = 'both';
      } else if (cityMatches) {
        matchType = 'city';
      } else {
        matchType = 'country';
      }

      uniqueLocations.set(key, {
        city,
        country,
        match_type: matchType,
      });

      // Stop if we've reached the limit
      if (uniqueLocations.size >= limit) {
        break;
      }
    }

    // Convert to array and sort by relevance
    return Array.from(uniqueLocations.values()).sort((a, b) => {
      // Prioritize exact matches and city matches over country matches
      const aScore = this.calculateRelevanceScore(a, queryLower);
      const bScore = this.calculateRelevanceScore(b, queryLower);

      if (aScore !== bScore) {
        return bScore - aScore; // Higher score first
      }

      // Secondary sort by city name alphabetically
      return a.city.localeCompare(b.city);
    });
  }

  /**
   * Calculate relevance score for sorting suggestions
   * @param suggestion - Location suggestion
   * @param query - Search query
   * @returns Relevance score (higher is better)
   */
  private calculateRelevanceScore(suggestion: LocationSuggestion, query: string): number {
    let score = 0;
    const cityLower = suggestion.city.toLowerCase();
    const countryLower = suggestion.country.toLowerCase();

    // Exact matches get highest score
    if (cityLower === query) score += 100;
    if (countryLower === query) score += 90;

    // Prefix matches
    if (cityLower.startsWith(query)) score += 50;
    if (countryLower.startsWith(query)) score += 40;

    // Both city and country match
    if (suggestion.match_type === 'both') score += 20;

    // Prefer shorter names (more specific)
    score -= cityLower.length * 0.1;

    return score;
  }

  /**
   * Get popular locations (most frequently used in properties)
   * @param limit - Maximum number of results
   * @returns Promise with popular locations
   */
  async getPopularLocations(
    limit = 10
  ): Promise<LocationServiceResponse<LocationAutocompleteResponse>> {
    try {
      console.time('popular-locations-query');

      // Check cache first
      console.time('popular-cache-check');
      const cachedResult = await cacheService.getCachedPopularLocations(limit);
      console.timeEnd('popular-cache-check');

      if (cachedResult) {
        console.timeEnd('popular-locations-query');
        return {
          success: true,
          data: cachedResult,
        };
      }

      // TODO: PERFORMANCE ISSUE - This query fetches ALL properties then counts client-side
      // TODO: Use SQL aggregation (COUNT, GROUP BY) instead of client-side counting
      // TODO: Consider materialized view for popular locations with refresh schedule
      const { data, error } = await this.supabase
        .from('properties')
        .select('city, country')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error in popular locations:', error);
        return {
          success: false,
          error: 'Failed to fetch popular locations',
          details: error,
        };
      }

      if (!data || data.length === 0) {
        return {
          success: true,
          data: {
            suggestions: [],
            total: 0,
            query: '',
          },
        };
      }

      // TODO: PERFORMANCE ISSUE - Client-side aggregation is very inefficient
      // TODO: This should be done in SQL with GROUP BY and COUNT
      console.time('popular-locations-processing');
      const locationCounts = new Map<
        string,
        { location: { city: string; country: string }; count: number }
      >();

      for (const item of data) {
        const key = `${item.city.toLowerCase()}-${item.country.toLowerCase()}`;
        const existing = locationCounts.get(key);

        if (existing) {
          existing.count++;
        } else {
          locationCounts.set(key, {
            location: { city: item.city, country: item.country },
            count: 1,
          });
        }
      }

      // Sort by frequency and convert to suggestions
      const suggestions = Array.from(locationCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(
          (item): LocationSuggestion => ({
            city: item.location.city,
            country: item.location.country,
            match_type: 'city' as const,
          })
        );
      console.timeEnd('popular-locations-processing');

      const result = {
        suggestions,
        total: suggestions.length,
        query: '',
      };

      // Cache the result
      console.time('popular-cache-set');
      await cacheService.cachePopularLocations(limit, result, 300); // 5 minutes TTL
      console.timeEnd('popular-cache-set');

      console.timeEnd('popular-locations-query');

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Popular locations service error:', error);
      console.timeEnd('popular-locations-query');
      return {
        success: false,
        error: 'Internal server error',
        details: error,
      };
    }
  }

  /**
   * Invalidate location caches when properties are updated
   * Call this method when properties are created, updated, or deleted
   */
  async invalidateLocationCaches(): Promise<void> {
    try {
      await cacheService.invalidateLocationCaches();
      console.log('Location caches invalidated successfully');
    } catch (error) {
      console.error('Failed to invalidate location caches:', error);
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();
