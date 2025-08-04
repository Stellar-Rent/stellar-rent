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
   * Get location suggestions based on user query (with caching)
   * @param query - Search query string
   * @param limit - Maximum number of results to return (default: 20)
   * @returns Promise with location suggestions
   */
  async getLocationSuggestions(
    query: string,
    limit = 20
  ): Promise<LocationServiceResponse<LocationAutocompleteResponse>> {
    try {
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

      // Try to get from cache first
      const cachedResult = await cacheService.getCachedLocationSuggestions(sanitizedQuery, limit);

      if (cachedResult) {
        console.log(`📖 Cache hit for location suggestions: ${sanitizedQuery}`);
        return {
          success: true,
          data: cachedResult as LocationAutocompleteResponse,
        };
      }

      // Query database for distinct city/country combinations
      const { data, error } = await this.supabase
        .from('properties')
        .select('city, country')
        .or(`city.ilike.${sanitizedQuery}%,country.ilike.${sanitizedQuery}%`)
        .eq('status', 'available') // Only include available properties
        .order('city', { ascending: true })
        .limit(limit * 2); // Get more results to account for deduplication

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

      // Process and deduplicate results
      const suggestions = this.processLocationResults(data, sanitizedQuery, limit);

      const result = {
        suggestions,
        total: suggestions.length,
        query,
      };

      // Cache the result
      await cacheService.cacheLocationSuggestions(sanitizedQuery, limit, result);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Location service error:', error);
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
   * Get popular locations (most frequently used in properties) with caching
   * @param limit - Maximum number of results
   * @returns Promise with popular locations
   */
  async getPopularLocations(
    limit = 10
  ): Promise<LocationServiceResponse<LocationAutocompleteResponse>> {
    try {
      // Try to get from cache first
      const cachedResult = await cacheService.getCachedPopularLocations(limit);

      if (cachedResult) {
        console.log(`📖 Cache hit for popular locations (limit: ${limit})`);
        return {
          success: true,
          data: cachedResult as LocationAutocompleteResponse,
        };
      }

      // Use materialized view for better performance
      const { data, error } = await this.supabase
        .from('popular_searches')
        .select('city, country')
        .order('property_count', { ascending: false })
        .limit(limit);

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

      // Convert to suggestions format
      const suggestions = data.map(
        (item): LocationSuggestion => ({
          city: item.city,
          country: item.country,
          match_type: 'city' as const,
        })
      );

      const result = {
        suggestions,
        total: suggestions.length,
        query: '',
      };

      // Cache the result
      await cacheService.cachePopularLocations(limit, result);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Popular locations service error:', error);
      return {
        success: false,
        error: 'Internal server error',
        details: error,
      };
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();
