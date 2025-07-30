'use client';

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Star,
  Users,
  Home,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useState, useMemo } from 'react';

interface AnalyticsData {
  overview: {
    totalBookings: number;
    totalEarnings: number;
    averageRating: number;
    totalProperties: number;
    activeBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalGuests: number;
  };
  trends: {
    bookings: { date: string; count: number; revenue: number }[];
    ratings: { date: string; average: number; count: number }[];
    occupancy: { date: string; rate: number }[];
  };
  topProperties: {
    id: number;
    title: string;
    bookings: number;
    revenue: number;
    rating: number;
    occupancyRate: number;
  }[];
  revenueBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  monthlyStats: {
    month: string;
    bookings: number;
    revenue: number;
    guests: number;
  }[];
}

interface AnalyticsProps {
  data: AnalyticsData;
  userType: 'tenant' | 'host';
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onExport?: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({
  data,
  userType,
  isLoading = false,
  error,
  onRefresh,
  onExport,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'bookings' | 'revenue' | 'rating' | 'occupancy'>('bookings');

  const metricOptions = [
    { value: 'bookings', label: 'Bookings', icon: Calendar },
    { value: 'revenue', label: 'Revenue', icon: DollarSign },
    { value: 'rating', label: 'Rating', icon: Star },
    { value: 'occupancy', label: 'Occupancy', icon: Home },
  ];

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
  ];

  // Calculate percentage changes
  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Mock data for trends (in real app, this would come from the API)
  const trendData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        bookings: Math.floor(Math.random() * 10) + 1,
        revenue: Math.floor(Math.random() * 1000) + 100,
        rating: Math.random() * 2 + 3.5,
        occupancy: Math.random() * 0.4 + 0.6,
      });
    }
    
    return data;
  }, [timeRange]);

  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }: {
    title: string;
    value: string | number;
    change?: number;
    icon: any;
    color?: string;
  }) => (
    <div className="bg-white dark:bg-[#0B1D39] rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ml-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/20`}>
          <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-[#0B1D39] rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );

  const SimpleBarChart = ({ data, height = 200 }: { data: any[]; height?: number }) => (
    <div className="relative" style={{ height }}>
      <div className="flex items-end justify-between h-full space-x-2">
        {data.map((item, index) => {
          const maxValue = Math.max(...data.map(d => d.value));
          const percentage = (item.value / maxValue) * 100;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                style={{ height: `${percentage}%` }}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const SimpleLineChart = ({ data, height = 200 }: { data: any[]; height?: number }) => (
    <div className="relative" style={{ height }}>
      <svg className="w-full h-full" viewBox={`0 0 ${data.length * 40} ${height}`}>
        <polyline
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          points={data.map((item, index) => `${index * 40 + 20},${height - (item.value / Math.max(...data.map(d => d.value))) * height}`).join(' ')}
        />
        {data.map((item, index) => (
          <circle
            key={index}
            cx={index * 40 + 20}
            cy={height - (item.value / Math.max(...data.map(d => d.value))) * height}
            r="3"
            fill="#3B82F6"
          />
        ))}
      </svg>
    </div>
  );

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <Activity className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {userType === 'host' ? 'Track your property performance and earnings' : 'Monitor your booking activity and spending'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
          >
            {timeRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={userType === 'host' ? 'Total Bookings' : 'My Bookings'}
          value={data.overview.totalBookings}
          change={12.5}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title={userType === 'host' ? 'Total Earnings' : 'Total Spent'}
          value={`$${data.overview.totalEarnings.toLocaleString()}`}
          change={8.2}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Average Rating"
          value={data.overview.averageRating.toFixed(1)}
          change={-2.1}
          icon={Star}
          color="yellow"
        />
        {userType === 'host' ? (
          <StatCard
            title="Total Properties"
            value={data.overview.totalProperties}
            change={5.7}
            icon={Home}
            color="purple"
          />
        ) : (
          <StatCard
            title="Total Guests"
            value={data.overview.totalGuests}
            change={15.3}
            icon={Users}
            color="purple"
          />
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart */}
        <ChartCard title={`${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trends`}>
          <div className="mb-4">
            <div className="flex space-x-2">
              {metricOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedMetric(option.value as any)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedMetric === option.value
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 inline mr-1" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <SimpleLineChart
            data={trendData.map((item, index) => ({
              label: item.date,
              value: selectedMetric === 'bookings' ? item.bookings :
                     selectedMetric === 'revenue' ? item.revenue :
                     selectedMetric === 'rating' ? item.rating * 10 :
                     item.occupancy * 100,
            }))}
            height={300}
          />
        </ChartCard>

        {/* Revenue Breakdown */}
        <ChartCard title="Revenue Breakdown">
          <div className="space-y-4">
            {data.revenueBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{
                      backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
                    }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.category}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    ${item.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Stats */}
        <ChartCard title="Monthly Performance">
          <SimpleBarChart
            data={data.monthlyStats.map((item) => ({
              label: item.month,
              value: userType === 'host' ? item.revenue : item.bookings,
            }))}
            height={250}
          />
        </ChartCard>

        {/* Top Properties (for hosts) or Recent Activity (for tenants) */}
        <ChartCard title={userType === 'host' ? 'Top Performing Properties' : 'Recent Activity'}>
          <div className="space-y-3">
            {(userType === 'host' ? data.topProperties : []).slice(0, 5).map((property, index) => (
              <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{property.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {property.bookings} bookings • ${property.revenue}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                    <span className="text-sm font-medium">{property.rating}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {property.occupancyRate.toFixed(0)}% occupancy
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Quick Stats */}
        <ChartCard title="Quick Stats">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Bookings</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {data.overview.activeBookings}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {data.overview.completedBookings}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Cancelled</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {data.overview.cancelledBookings}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
              <span className="text-sm font-medium text-green-600">
                {((data.overview.completedBookings / data.overview.totalBookings) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default Analytics; 