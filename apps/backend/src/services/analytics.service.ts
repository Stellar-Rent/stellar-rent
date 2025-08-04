import { supabase } from '../config/supabase';
import { cacheService } from './cache.service';

export interface SearchAnalytics {
  id: string;
  query: string;
  filters: Record<string, unknown>;
  results_count: number;
  search_time_ms: number;
  cached: boolean;
  user_agent?: string;
  ip_address?: string;
  timestamp: string;
  session_id?: string;
}

export interface SearchMetrics {
  total_searches: number;
  avg_search_time: number;
  cache_hit_rate: number;
  popular_queries: Array<{ query: string; count: number; avg_time: number }>;
  popular_filters: Array<{ filter: string; count: number }>;
  performance_by_time: Array<{
    hour: number;
    searches: number;
    avg_time: number;
  }>;
}

export interface SearchInsights {
  slow_queries: Array<{ query: string; avg_time: number; count: number }>;
  high_value_searches: Array<{ query: string; conversion_rate: number }>;
  filter_combinations: Array<{ filters: string; usage_count: number }>;
  user_behavior: {
    avg_filters_per_search: number;
    most_common_sort: string;
    mobile_vs_desktop: { mobile: number; desktop: number };
  };
}

export class AnalyticsService {
  /**
   * Track a search event
   */
  async trackSearch(analytics: Omit<SearchAnalytics, 'id' | 'timestamp'>): Promise<void> {
    try {
      const searchEvent: SearchAnalytics = {
        ...analytics,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      };

      // Store in cache for real-time analytics
      await cacheService.set(
        {
          type: 'search',
          query: 'analytics',
          filters: { timestamp: searchEvent.timestamp },
        },
        searchEvent
      );

      // Store in database for historical analysis
      const { error } = await supabase.from('search_analytics').insert({
        id: searchEvent.id,
        query: searchEvent.query,
        filters: searchEvent.filters,
        results_count: searchEvent.results_count,
        search_time_ms: searchEvent.search_time_ms,
        cached: searchEvent.cached,
        user_agent: searchEvent.user_agent,
        ip_address: searchEvent.ip_address,
        timestamp: searchEvent.timestamp,
        session_id: searchEvent.session_id,
      });

      if (error) {
        console.error('Failed to store search analytics:', error);
      }

      console.log(`📊 Tracked search: ${searchEvent.query} (${searchEvent.search_time_ms}ms)`);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  /**
   * Get search metrics for the last 24 hours
   */
  async getSearchMetrics(hours = 24): Promise<SearchMetrics> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('search_analytics')
        .select('*')
        .gte('timestamp', since.toISOString())
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Failed to fetch search metrics:', error);
        return this.getDefaultMetrics();
      }

      const searches = data || [];

      // Calculate metrics
      const totalSearches = searches.length;
      const avgSearchTime =
        searches.length > 0
          ? searches.reduce((sum, s) => sum + s.search_time_ms, 0) / searches.length
          : 0;
      const cacheHitRate =
        searches.length > 0 ? (searches.filter((s) => s.cached).length / searches.length) * 100 : 0;

      // Popular queries
      const queryCounts = new Map<string, { count: number; totalTime: number }>();
      for (const search of searches) {
        const existing = queryCounts.get(search.query) || {
          count: 0,
          totalTime: 0,
        };
        queryCounts.set(search.query, {
          count: existing.count + 1,
          totalTime: existing.totalTime + search.search_time_ms,
        });
      }

      const popularQueries = Array.from(queryCounts.entries())
        .map(([query, { count, totalTime }]) => ({
          query,
          count,
          avg_time: totalTime / count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Popular filters
      const filterCounts = new Map<string, number>();
      for (const search of searches) {
        for (const filter of Object.keys(search.filters || {})) {
          filterCounts.set(filter, (filterCounts.get(filter) || 0) + 1);
        }
      }

      const popularFilters = Array.from(filterCounts.entries())
        .map(([filter, count]) => ({ filter, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Performance by time
      const hourlyStats = new Map<number, { searches: number; totalTime: number }>();
      for (const search of searches) {
        const hour = new Date(search.timestamp).getHours();
        const existing = hourlyStats.get(hour) || { searches: 0, totalTime: 0 };
        hourlyStats.set(hour, {
          searches: existing.searches + 1,
          totalTime: existing.totalTime + search.search_time_ms,
        });
      }

      const performanceByTime = Array.from(hourlyStats.entries())
        .map(([hour, { searches, totalTime }]) => ({
          hour,
          searches,
          avg_time: totalTime / searches,
        }))
        .sort((a, b) => a.hour - b.hour);

      return {
        total_searches: totalSearches,
        avg_search_time: Math.round(avgSearchTime),
        cache_hit_rate: Math.round(cacheHitRate * 100) / 100,
        popular_queries: popularQueries,
        popular_filters: popularFilters,
        performance_by_time: performanceByTime,
      };
    } catch (error) {
      console.error('Failed to get search metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Get search insights for optimization
   */
  async getSearchInsights(): Promise<SearchInsights> {
    try {
      const { data, error } = await supabase
        .from('search_analytics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Failed to fetch search insights:', error);
        return this.getDefaultInsights();
      }

      const searches = data || [];

      // Slow queries
      const slowQueries = searches
        .filter((s) => s.search_time_ms > 500) // Queries taking more than 500ms
        .reduce(
          (acc, search) => {
            const existing = acc.find((q) => q.query === search.query);
            if (existing) {
              existing.avg_time = (existing.avg_time + search.search_time_ms) / 2;
              existing.count += 1;
            } else {
              acc.push({
                query: search.query,
                avg_time: search.search_time_ms,
                count: 1,
              });
            }
            return acc;
          },
          [] as Array<{ query: string; avg_time: number; count: number }>
        )
        .sort((a, b) => b.avg_time - a.avg_time)
        .slice(0, 10);

      // Filter combinations
      const filterCombinations = new Map<string, number>();
      for (const search of searches) {
        const filterKeys = Object.keys(search.filters || {}).sort();
        const combination = filterKeys.join(',');
        filterCombinations.set(combination, (filterCombinations.get(combination) || 0) + 1);
      }

      const topFilterCombinations = Array.from(filterCombinations.entries())
        .map(([filters, usage_count]) => ({ filters, usage_count }))
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 10);

      // User behavior
      const avgFiltersPerSearch =
        searches.length > 0
          ? searches.reduce((sum, s) => sum + Object.keys(s.filters || {}).length, 0) /
            searches.length
          : 0;

      const userBehavior = {
        avg_filters_per_search: Math.round(avgFiltersPerSearch * 100) / 100,
        most_common_sort: 'relevance', // Would need to track sort options
        mobile_vs_desktop: {
          mobile: searches.filter((s) => s.user_agent?.includes('Mobile')).length,
          desktop: searches.filter((s) => !s.user_agent?.includes('Mobile')).length,
        },
      };

      return {
        slow_queries: slowQueries,
        high_value_searches: [], // Would need conversion data
        filter_combinations: topFilterCombinations,
        user_behavior: userBehavior,
      };
    } catch (error) {
      console.error('Failed to get search insights:', error);
      return this.getDefaultInsights();
    }
  }

  /**
   * Get real-time search performance
   */
  async getRealTimeMetrics(): Promise<{
    active_searches: number;
    avg_response_time: number;
    cache_hit_rate: number;
    recent_queries: Array<{ query: string; timestamp: string }>;
  }> {
    try {
      const cacheStats = await cacheService.getStats();

      // Get recent searches from cache
      const recentSearches = await this.getRecentSearchesFromCache();

      return {
        active_searches: recentSearches.length,
        avg_response_time:
          recentSearches.length > 0
            ? recentSearches.reduce((sum, s) => sum + s.search_time_ms, 0) / recentSearches.length
            : 0,
        cache_hit_rate: cacheStats.connected ? 85 : 0, // Mock cache hit rate
        recent_queries: recentSearches.slice(0, 5).map((s) => ({
          query: s.query,
          timestamp: s.timestamp,
        })),
      };
    } catch (error) {
      console.error('Failed to get real-time metrics:', error);
      return {
        active_searches: 0,
        avg_response_time: 0,
        cache_hit_rate: 0,
        recent_queries: [],
      };
    }
  }

  /**
   * Get recent searches from cache
   */
  private async getRecentSearchesFromCache(): Promise<SearchAnalytics[]> {
    try {
      // This would typically query a cache-based analytics store
      // For now, return mock data
      return [];
    } catch (error) {
      console.error('Failed to get recent searches from cache:', error);
      return [];
    }
  }

  /**
   * Get default metrics when database is unavailable
   */
  private getDefaultMetrics(): SearchMetrics {
    return {
      total_searches: 0,
      avg_search_time: 0,
      cache_hit_rate: 0,
      popular_queries: [],
      popular_filters: [],
      performance_by_time: [],
    };
  }

  /**
   * Get default insights when database is unavailable
   */
  private getDefaultInsights(): SearchInsights {
    return {
      slow_queries: [],
      high_value_searches: [],
      filter_combinations: [],
      user_behavior: {
        avg_filters_per_search: 0,
        most_common_sort: 'relevance',
        mobile_vs_desktop: { mobile: 0, desktop: 0 },
      },
    };
  }

  /**
   * Clean up old analytics data
   */
  async cleanupOldAnalytics(daysToKeep = 30): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('search_analytics')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (error) {
        console.error('Failed to cleanup old analytics:', error);
      } else {
        console.log(`🧹 Cleaned up analytics older than ${daysToKeep} days`);
      }
    } catch (error) {
      console.error('Analytics cleanup error:', error);
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(startDate: Date, endDate: Date): Promise<SearchAnalytics[]> {
    try {
      const { data, error } = await supabase
        .from('search_analytics')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Failed to export analytics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Analytics export error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
