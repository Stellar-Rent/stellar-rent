import { supabase } from '../config/supabase';
import type {
  Property,
  PropertySearchFilters,
  PropertySearchOptions,
} from '../types/property.types';
import { cacheService } from './cache.service';

export interface SearchResult {
  properties: Property[];
  total: number;
  page: number;
  limit: number;
  relevance_scores?: Record<string, number>;
  search_time_ms: number;
  cached: boolean;
}

export interface AdvancedSearchFilters extends PropertySearchFilters {
  // Location-based filters
  latitude?: number;
  longitude?: number;
  radius_km?: number;

  // Advanced price filters
  price_range?: 'budget' | 'mid_range' | 'luxury';

  // Property type filters
  property_type?: 'apartment' | 'house' | 'villa' | 'studio' | 'loft';

  // Advanced amenity filters
  must_have_amenities?: string[];
  nice_to_have_amenities?: string[];

  // Date availability filters
  check_in?: string;
  check_out?: string;

  // Guest capacity filters
  min_guests?: number;
  max_guests?: number;

  // Rating and review filters
  min_rating?: number;

  // Sort options
  sort_by?: 'relevance' | 'price' | 'distance' | 'rating' | 'newest' | 'popularity';
  sort_order?: 'asc' | 'desc';
}

export interface SearchAnalytics {
  query: string;
  filters: Record<string, unknown>;
  results_count: number;
  search_time_ms: number;
  timestamp: string;
  user_agent?: string;
  ip_address?: string;
}

export class SearchService {
  /**
   * Advanced property search with caching and optimization
   */
  async searchProperties(
    filters: AdvancedSearchFilters = {},
    options: PropertySearchOptions = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();

    // Generate cache key
    const cacheKey = this.generateCacheKey(filters, options);

    // Try to get from cache first
    const cachedResult = await cacheService.getCachedSearchResults(
      cacheKey,
      filters,
      options.page || 1,
      options.limit || 10
    );

    if (cachedResult) {
      return {
        ...(cachedResult as SearchResult),
        search_time_ms: Date.now() - startTime,
        cached: true,
      };
    }

    // Build optimized query
    const query = this.buildSearchQuery(filters, options);

    // Execute search
    const { data: properties, error } = await query;

    if (error) {
      console.error('Search query error:', error);
      throw new Error('Failed to search properties');
    }

    // Apply post-processing filters
    let filteredProperties = properties as Property[];

    // Apply availability filtering if dates provided
    if (filters.check_in && filters.check_out) {
      filteredProperties = await this.filterByAvailability(
        filteredProperties,
        filters.check_in,
        filters.check_out
      );
    }

    // Apply distance filtering if coordinates provided
    if (filters.latitude && filters.longitude && filters.radius_km) {
      filteredProperties = await this.filterByDistance(
        filteredProperties,
        filters.latitude,
        filters.longitude,
        filters.radius_km
      );
    }

    // Calculate relevance scores
    const relevanceScores = this.calculateRelevanceScores(filteredProperties, filters);

    // Sort by relevance if requested
    if (filters.sort_by === 'relevance') {
      filteredProperties = this.sortByRelevance(filteredProperties, relevanceScores);
    }

    // Apply pagination
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;
    const paginatedProperties = filteredProperties.slice(offset, offset + limit);

    const result: SearchResult = {
      properties: paginatedProperties,
      total: filteredProperties.length,
      page,
      limit,
      relevance_scores: relevanceScores,
      search_time_ms: Date.now() - startTime,
      cached: false,
    };

    // Cache the result
    await cacheService.cacheSearchResults(cacheKey, filters, page, limit, result);

    // Track search analytics
    await this.trackSearchAnalytics(filters, result);

    return result;
  }

  /**
   * Build optimized database query
   */
  private buildSearchQuery(filters: AdvancedSearchFilters, options: PropertySearchOptions) {
    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('status', 'available');

    // Apply basic filters
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

    // Apply price range filters
    if (filters.price_range) {
      const priceRanges = {
        budget: { min: 0, max: 100 },
        mid_range: { min: 100, max: 300 },
        luxury: { min: 300, max: 1000 },
      };
      const range = priceRanges[filters.price_range];
      if (range) {
        query = query.gte('price', range.min).lte('price', range.max);
      }
    }

    // Apply amenity filters
    if (filters.amenities && filters.amenities.length > 0) {
      query = query.contains('amenities', filters.amenities);
    }

    // Apply must-have amenities
    if (filters.must_have_amenities && filters.must_have_amenities.length > 0) {
      query = query.contains('amenities', filters.must_have_amenities);
    }

    // Apply property type filtering based on amenities
    if (filters.property_type) {
      const typeAmenities = this.getPropertyTypeAmenities(filters.property_type);
      if (typeAmenities.length > 0) {
        query = query.overlaps('amenities', typeAmenities);
      }
    }

    // Apply guest capacity filters
    if (filters.min_guests) {
      query = query.gte('max_guests', filters.min_guests);
    }

    if (filters.max_guests) {
      query = query.lte('max_guests', filters.max_guests);
    }

    // Apply sorting
    const { sort_by = 'created_at', sort_order = 'desc' } = options;
    const sortField = this.getSortField(sort_by);
    query = query.order(sortField, { ascending: sort_order === 'asc' });

    return query;
  }

  /**
   * Filter properties by availability
   */
  private async filterByAvailability(
    properties: Property[],
    checkIn: string,
    checkOut: string
  ): Promise<Property[]> {
    const availableProperties: Property[] = [];

    for (const property of properties) {
      try {
        const isAvailable = await this.checkPropertyAvailability(property.id, checkIn, checkOut);
        if (isAvailable) {
          availableProperties.push(property);
        }
      } catch (error) {
        console.error(`Error checking availability for property ${property.id}:`, error);
        // Include property if availability check fails
        availableProperties.push(property);
      }
    }

    return availableProperties;
  }

  /**
   * Check property availability using database function
   */
  private async checkPropertyAvailability(
    propertyId: string,
    checkIn: string,
    checkOut: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_property_available', {
      property_id: propertyId,
      check_in_date: checkIn,
      check_out_date: checkOut,
    });

    if (error) {
      console.error('Availability check error:', error);
      return true; // Default to available if check fails
    }

    return data as boolean;
  }

  /**
   * Filter properties by distance
   */
  private async filterByDistance(
    properties: Property[],
    lat: number,
    lon: number,
    radiusKm: number
  ): Promise<Property[]> {
    return properties.filter((property) => {
      if (!property.location?.coordinates) return false;

      const distance = this.calculateDistance(
        lat,
        lon,
        property.location.coordinates.latitude,
        property.location.coordinates.longitude
      );

      return distance <= radiusKm;
    });
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate relevance scores for properties
   */
  private calculateRelevanceScores(
    properties: Property[],
    filters: AdvancedSearchFilters
  ): Record<string, number> {
    const scores: Record<string, number> = {};

    for (const property of properties) {
      let score = 0;

      // Base score from property attributes
      score += this.calculateBaseScore(property);

      // Location relevance
      if (filters.city || filters.country) {
        score += this.calculateLocationRelevance(property, filters);
      }

      // Price relevance
      if (filters.min_price || filters.max_price) {
        score += this.calculatePriceRelevance(property, filters);
      }

      // Amenity relevance
      if (filters.amenities || filters.must_have_amenities) {
        score += this.calculateAmenityRelevance(property, filters);
      }

      // Distance relevance
      if (filters.latitude && filters.longitude) {
        score += this.calculateDistanceRelevance(property, filters);
      }

      scores[property.id] = Math.max(0, score);
    }

    return scores;
  }

  /**
   * Calculate base relevance score
   */
  private calculateBaseScore(property: Property): number {
    let score = 0;

    // Newer properties get higher scores
    const daysSinceCreation =
      (Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 100 - daysSinceCreation);

    // Properties with more amenities get higher scores
    score += (property.amenities?.length || 0) * 5;

    // Properties with images get higher scores
    score += (property.images?.length || 0) * 2;

    return score;
  }

  /**
   * Calculate location relevance
   */
  private calculateLocationRelevance(property: Property, filters: AdvancedSearchFilters): number {
    let score = 0;

    if (filters.city && property.location?.city) {
      const cityMatch = property.location.city.toLowerCase().includes(filters.city.toLowerCase());
      if (cityMatch) score += 50;
    }

    if (filters.country && property.location?.country) {
      const countryMatch = property.location.country
        .toLowerCase()
        .includes(filters.country.toLowerCase());
      if (countryMatch) score += 30;
    }

    return score;
  }

  /**
   * Calculate price relevance
   */
  private calculatePriceRelevance(property: Property, filters: AdvancedSearchFilters): number {
    let score = 0;

    if (filters.min_price && property.price >= filters.min_price) {
      score += 20;
    }

    if (filters.max_price && property.price <= filters.max_price) {
      score += 20;
    }

    return score;
  }

  /**
   * Calculate amenity relevance
   */
  private calculateAmenityRelevance(property: Property, filters: AdvancedSearchFilters): number {
    let score = 0;
    const propertyAmenities = property.amenities?.map((a) => a.toLowerCase()) || [];

    // Must-have amenities
    if (filters.must_have_amenities) {
      const mustHaveCount = filters.must_have_amenities.filter((amenity) =>
        propertyAmenities.includes(amenity.toLowerCase())
      ).length;
      score += mustHaveCount * 20;
    }

    // Nice-to-have amenities
    if (filters.nice_to_have_amenities) {
      const niceToHaveCount = filters.nice_to_have_amenities.filter((amenity) =>
        propertyAmenities.includes(amenity.toLowerCase())
      ).length;
      score += niceToHaveCount * 5;
    }

    return score;
  }

  /**
   * Calculate distance relevance
   */
  private calculateDistanceRelevance(property: Property, filters: AdvancedSearchFilters): number {
    if (!filters.latitude || !filters.longitude || !property.location?.coordinates) {
      return 0;
    }

    const distance = this.calculateDistance(
      filters.latitude,
      filters.longitude,
      property.location.coordinates.latitude,
      property.location.coordinates.longitude
    );

    // Closer properties get higher scores
    return Math.max(0, 100 - distance * 10);
  }

  /**
   * Sort properties by relevance
   */
  private sortByRelevance(
    properties: Property[],
    relevanceScores: Record<string, number>
  ): Property[] {
    return properties.sort((a, b) => {
      const scoreA = relevanceScores[a.id] || 0;
      const scoreB = relevanceScores[b.id] || 0;
      return scoreB - scoreA;
    });
  }

  /**
   * Get property type amenities
   */
  private getPropertyTypeAmenities(propertyType: string): string[] {
    const typeAmenities: Record<string, string[]> = {
      apartment: ['kitchen', 'bathroom'],
      house: ['kitchen', 'garden', 'parking'],
      villa: ['pool', 'garden', 'parking', 'kitchen'],
      studio: ['kitchen'],
      loft: ['kitchen', 'high_ceilings'],
    };

    return typeAmenities[propertyType] || [];
  }

  /**
   * Get sort field mapping
   */
  private getSortField(sortBy: string): string {
    const sortFields: Record<string, string> = {
      relevance: 'created_at',
      price: 'price',
      distance: 'created_at',
      rating: 'created_at',
      newest: 'created_at',
      popularity: 'created_at',
    };

    return sortFields[sortBy] || 'created_at';
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(filters: AdvancedSearchFilters, options: PropertySearchOptions): string {
    const keyParts = ['search', JSON.stringify(filters), JSON.stringify(options)];

    return keyParts.join(':');
  }

  /**
   * Track search analytics
   */
  private async trackSearchAnalytics(
    filters: AdvancedSearchFilters,
    result: SearchResult
  ): Promise<void> {
    try {
      const analytics: SearchAnalytics = {
        query: filters.city || filters.country || 'general',
        filters,
        results_count: result.total,
        search_time_ms: result.search_time_ms,
        timestamp: new Date().toISOString(),
      };

      // Store analytics in cache for later analysis
      await cacheService.set(
        {
          type: 'search',
          query: 'analytics',
          filters: { timestamp: analytics.timestamp },
        },
        analytics
      );
    } catch (error) {
      console.error('Failed to track search analytics:', error);
    }
  }

  /**
   * Get search suggestions based on popular searches
   */
  async getSearchSuggestions(query: string, limit = 5): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('popular_searches')
        .select('city, country')
        .or(`city.ilike.%${query}%,country.ilike.%${query}%`)
        .order('property_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Search suggestions error:', error);
        return [];
      }

      return (data || []).map((item) => `${item.city}, ${item.country}`);
    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(): Promise<{
    total_searches: number;
    avg_search_time: number;
    popular_queries: Array<{ query: string; count: number }>;
  }> {
    // This would typically query a dedicated analytics table
    // For now, return mock data
    return {
      total_searches: 0,
      avg_search_time: 0,
      popular_queries: [],
    };
  }
}

// Export singleton instance
export const searchService = new SearchService();
