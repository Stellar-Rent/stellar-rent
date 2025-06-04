import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import type {
  LocationAutocompleteResponse,
  LocationServiceResponse,
  LocationSuggestion,
} from '../types/location.types';

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

      return {
        success: true,
        data: {
          suggestions,
          total: suggestions.length,
          query,
        },
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
   * Get popular locations (most frequently used in properties)
   * @param limit - Maximum number of results
   * @returns Promise with popular locations
   */
  async getPopularLocations(
    limit = 10
  ): Promise<LocationServiceResponse<LocationAutocompleteResponse>> {
    try {
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

      // Count frequency of each location
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

      return {
        success: true,
        data: {
          suggestions,
          total: suggestions.length,
          query: '',
        },
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
