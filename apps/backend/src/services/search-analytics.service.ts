import { createHash } from 'node:crypto';
import { supabase } from '../config/supabase';
import { cacheService } from './cache.service';

export interface SearchAnalyticsData {
  id?: string;
  query_hash: string;
  search_params: Record<string, any>;
  result_count: number;
  response_time_ms: number;
  user_id?: string;
  created_at?: string;
  ip_address?: string;
}

export interface SearchMetrics {
  total_searches: number;
  avg_response_time: number;
  popular_searches: Array<{
    query_hash: string;
    search_params: Record<string, any>;
    search_count: number;
  }>;
  slow_queries: Array<{
    query_hash: string;
    search_params: Record<string, any>;
    avg_response_time: number;
  }>;
  search_trends: Array<{
    date: string;
    search_count: number;
    avg_response_time: number;
  }>;
}

export class SearchAnalyticsService {
  async logSearch(
    searchParams: Record<string, any>,
    resultCount: number,
    responseTime: number,
    userId?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      const queryHash = this.generateQueryHash(searchParams);

      const analyticsData: SearchAnalyticsData = {
        query_hash: queryHash,
        search_params: searchParams,
        result_count: resultCount,
        response_time_ms: responseTime,
        user_id: userId,
        ip_address: ipAddress,
        created_at: new Date().toISOString(),
      };

      this.storeAnalytics(analyticsData).catch((error) => {
        console.error('Failed to store search analytics:', error);
      });

      await cacheService.cacheSearchAnalytics(queryHash, resultCount, responseTime, userId);
    } catch (error) {
      console.error('Search analytics logging error:', error);
    }
  }

  async getSearchMetrics(days = 7, limit = 10): Promise<SearchMetrics> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const { data: totalStats, error: totalError } = await supabase
        .from('search_analytics')
        .select('response_time_ms')
        .gte('created_at', fromDate.toISOString());

      if (totalError) {
        console.error('Failed to fetch total search stats:', totalError);
      }

      const totalSearches = totalStats?.length || 0;
      const avgResponseTime =
        totalSearches > 0 && totalStats
          ? totalStats.reduce((sum, s) => sum + s.response_time_ms, 0) / totalSearches
          : 0;

      const { data: popularData, error: popularError } = await supabase
        .from('search_analytics')
        .select('query_hash, search_params')
        .gte('created_at', fromDate.toISOString())
        .limit(1000);

      if (popularError) {
        console.error('Failed to fetch popular searches:', popularError);
      }

      const popularSearches = this.aggregatePopularSearches(popularData || [], limit);

      const { data: slowData, error: slowError } = await supabase
        .from('search_analytics')
        .select('query_hash, search_params, response_time_ms')
        .gte('created_at', fromDate.toISOString())
        .gte('response_time_ms', 1000)
        .order('response_time_ms', { ascending: false })
        .limit(limit);

      if (slowError) {
        console.error('Failed to fetch slow queries:', slowError);
      }

      const slowQueries = this.aggregateSlowQueries(slowData || []);

      const { data: trendsData, error: trendsError } = await supabase
        .from('search_analytics')
        .select('created_at, response_time_ms')
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: true });

      if (trendsError) {
        console.error('Failed to fetch search trends:', trendsError);
      }

      const searchTrends = this.aggregateSearchTrends(trendsData || []);

      return {
        total_searches: totalSearches,
        avg_response_time: Math.round(avgResponseTime),
        popular_searches: popularSearches,
        slow_queries: slowQueries,
        search_trends: searchTrends,
      };
    } catch (error) {
      console.error('Failed to get search metrics:', error);
      return {
        total_searches: 0,
        avg_response_time: 0,
        popular_searches: [],
        slow_queries: [],
        search_trends: [],
      };
    }
  }

  async getSearchSuggestions(partialQuery: string, limit = 5): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('search_analytics')
        .select('search_params')
        .or(
          `search_params->>city.ilike.%${partialQuery}%,search_params->>search_text.ilike.%${partialQuery}%`
        )
        .limit(limit * 2);

      if (error) {
        console.error('Failed to fetch search suggestions:', error);
        return [];
      }

      const suggestions = new Set<string>();

      data?.forEach((record) => {
        const params = record.search_params;
        if (params.city?.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.add(params.city);
        }
        if (params.search_text?.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.add(params.search_text);
        }
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  private generateQueryHash(searchParams: Record<string, any>): string {
    const normalizedParams = { ...searchParams };
    normalizedParams.page = undefined;
    normalizedParams.timestamp = undefined;

    const sortedParams = Object.keys(normalizedParams)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = normalizedParams[key];
          return result;
        },
        {} as Record<string, any>
      );

    return createHash('md5').update(JSON.stringify(sortedParams)).digest('hex');
  }

  private async storeAnalytics(data: SearchAnalyticsData): Promise<void> {
    const { error } = await supabase.from('search_analytics').insert(data);

    if (error) {
      throw error;
    }
  }

  private aggregatePopularSearches(
    data: Array<{ query_hash: string; search_params: Record<string, any> }>,
    limit: number
  ): Array<{ query_hash: string; search_params: Record<string, any>; search_count: number }> {
    const searchCounts = new Map<string, { params: Record<string, any>; count: number }>();

    data.forEach((record) => {
      const existing = searchCounts.get(record.query_hash);
      if (existing) {
        existing.count++;
      } else {
        searchCounts.set(record.query_hash, {
          params: record.search_params,
          count: 1,
        });
      }
    });

    return Array.from(searchCounts.entries())
      .map(([queryHash, { params, count }]) => ({
        query_hash: queryHash,
        search_params: params,
        search_count: count,
      }))
      .sort((a, b) => b.search_count - a.search_count)
      .slice(0, limit);
  }

  private aggregateSlowQueries(
    data: Array<{
      query_hash: string;
      search_params: Record<string, any>;
      response_time_ms: number;
    }>
  ): Array<{ query_hash: string; search_params: Record<string, any>; avg_response_time: number }> {
    const queryTimes = new Map<string, { params: Record<string, any>; times: number[] }>();

    data.forEach((record) => {
      const existing = queryTimes.get(record.query_hash);
      if (existing) {
        existing.times.push(record.response_time_ms);
      } else {
        queryTimes.set(record.query_hash, {
          params: record.search_params,
          times: [record.response_time_ms],
        });
      }
    });

    return Array.from(queryTimes.entries())
      .map(([queryHash, { params, times }]) => ({
        query_hash: queryHash,
        search_params: params,
        avg_response_time: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length),
      }))
      .sort((a, b) => b.avg_response_time - a.avg_response_time);
  }

  private aggregateSearchTrends(
    data: Array<{ created_at: string; response_time_ms: number }>
  ): Array<{ date: string; search_count: number; avg_response_time: number }> {
    const dailyStats = new Map<string, { count: number; totalTime: number }>();

    data.forEach((record) => {
      const date = record.created_at.split('T')[0];
      const existing = dailyStats.get(date);

      if (existing) {
        existing.count++;
        existing.totalTime += record.response_time_ms;
      } else {
        dailyStats.set(date, {
          count: 1,
          totalTime: record.response_time_ms,
        });
      }
    });

    return Array.from(dailyStats.entries())
      .map(([date, { count, totalTime }]) => ({
        date,
        search_count: count,
        avg_response_time: Math.round(totalTime / count),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const searchAnalyticsService = new SearchAnalyticsService();
