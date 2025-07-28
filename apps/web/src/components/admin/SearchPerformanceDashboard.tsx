'use client';

import {
  AlertTriangleIcon,
  ClockIcon,
  DatabaseIcon,
  SearchIcon,
  TrendingUpIcon,
  ZapIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SearchMetrics {
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

interface SearchInsights {
  slow_queries: Array<{ query: string; avg_time: number; count: number }>;
  high_value_searches: Array<{ query: string; conversion_rate: number }>;
  filter_combinations: Array<{ filters: string; usage_count: number }>;
  user_behavior: {
    avg_filters_per_search: number;
    most_common_sort: string;
    mobile_vs_desktop: { mobile: number; desktop: number };
  };
}

interface RealTimeMetrics {
  active_searches: number;
  avg_response_time: number;
  cache_hit_rate: number;
  recent_queries: Array<{ query: string; timestamp: string }>;
}

const _COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function SearchPerformanceDashboard() {
  const [metrics, setMetrics] = useState<SearchMetrics | null>(null);
  const [insights, setInsights] = useState<SearchInsights | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);

      // Simulate API calls
      const mockMetrics: SearchMetrics = {
        total_searches: 1247,
        avg_search_time: 187,
        cache_hit_rate: 78.5,
        popular_queries: [
          { query: 'Buenos Aires', count: 156, avg_time: 145 },
          { query: 'Miami', count: 134, avg_time: 167 },
          { query: 'Paris', count: 98, avg_time: 189 },
          { query: 'Tokyo', count: 87, avg_time: 203 },
          { query: 'London', count: 76, avg_time: 178 },
        ],
        popular_filters: [
          { filter: 'price_range', count: 892 },
          { filter: 'amenities', count: 654 },
          { filter: 'property_type', count: 543 },
          { filter: 'guests', count: 432 },
          { filter: 'dates', count: 321 },
        ],
        performance_by_time: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          searches: Math.floor(Math.random() * 50) + 10,
          avg_time: Math.floor(Math.random() * 100) + 150,
        })),
      };

      const mockInsights: SearchInsights = {
        slow_queries: [
          { query: 'luxury villa with pool', avg_time: 892, count: 5 },
          { query: 'pet friendly apartment', avg_time: 654, count: 12 },
          { query: 'downtown studio', avg_time: 543, count: 8 },
        ],
        high_value_searches: [
          { query: 'Buenos Aires luxury', conversion_rate: 12.5 },
          { query: 'Miami beachfront', conversion_rate: 8.7 },
          { query: 'Paris apartment', conversion_rate: 6.3 },
        ],
        filter_combinations: [
          { filters: 'price_range,amenities', usage_count: 234 },
          { filters: 'property_type,guests', usage_count: 187 },
          { filters: 'dates,price_range', usage_count: 156 },
        ],
        user_behavior: {
          avg_filters_per_search: 2.3,
          most_common_sort: 'relevance',
          mobile_vs_desktop: { mobile: 45, desktop: 55 },
        },
      };

      const mockRealTime: RealTimeMetrics = {
        active_searches: 12,
        avg_response_time: 187,
        cache_hit_rate: 78.5,
        recent_queries: [
          {
            query: 'Buenos Aires apartment',
            timestamp: new Date().toISOString(),
          },
          {
            query: 'Miami beach house',
            timestamp: new Date(Date.now() - 60000).toISOString(),
          },
          {
            query: 'Paris studio',
            timestamp: new Date(Date.now() - 120000).toISOString(),
          },
        ],
      };

      setMetrics(mockMetrics);
      setInsights(mockInsights);
      setRealTimeMetrics(mockRealTime);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Search Performance Dashboard
        </h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <SearchIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Searches</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.total_searches.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Response Time
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.avg_search_time}ms
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <DatabaseIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cache Hit Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.cache_hit_rate}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <ZapIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Searches
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {realTimeMetrics?.active_searches}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Over Time */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Search Performance Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics?.performance_by_time}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="searches" stroke="#0088FE" strokeWidth={2} />
              <Line type="monotone" dataKey="avg_time" stroke="#00C49F" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Popular Queries */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Popular Search Queries
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics?.popular_queries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="query" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slow Queries */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <AlertTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Slow Queries</h3>
          </div>
          <div className="space-y-3">
            {insights?.slow_queries.map((query) => (
              <div
                key={`${query.query}-${query.avg_time}`}
                className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{query.query}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{query.count} searches</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{query.avg_time}ms</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Behavior */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Behavior
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Avg Filters per Search
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {insights?.user_behavior.avg_filters_per_search}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Most Common Sort</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {insights?.user_behavior.most_common_sort}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Mobile vs Desktop</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {insights?.user_behavior.mobile_vs_desktop.mobile}% /{' '}
                {insights?.user_behavior.mobile_vs_desktop.desktop}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Search Activity
        </h3>
        <div className="space-y-3">
          {realTimeMetrics?.recent_queries.map((query) => (
            <div
              key={`${query.query}-${query.timestamp}`}
              className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{query.query}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(query.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
