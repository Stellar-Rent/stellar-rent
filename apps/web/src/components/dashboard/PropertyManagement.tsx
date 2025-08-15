'use client';

import {
  Activity,
  AlertCircle,
  BarChart3,
  Bath,
  Bed,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Edit3,
  Eye,
  Filter,
  Home,
  MapPin,
  PieChart,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';

interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  rating: number;
  reviews: number;
  image: string;
  status: 'active' | 'inactive' | 'maintenance';
  bookings: number;
  earnings: number;
  description?: string;
  amenities?: string[];
  propertyType?: string;
  rules?: string;
  occupancyRate?: number;
  averageRating?: number;
  totalBookings?: number;
  monthlyEarnings?: number;
}

interface PropertyManagementProps {
  properties: Property[];
  isLoading: boolean;
  onAddProperty: (property: Omit<Property, 'id'>) => void;
  onUpdateProperty: (id: number, property: Partial<Property>) => void;
  onDeleteProperty: (id: number) => void;
  onToggleStatus: (id: number, status: Property['status']) => void;
  error?: string | null;
}

interface FilterState {
  status: string;
  propertyType: string;
  priceRange: string;
  searchTerm: string;
}

const PropertyManagement: React.FC<PropertyManagementProps> = ({
  properties,
  isLoading,
  onAddProperty,
  onUpdateProperty,
  onDeleteProperty,
  onToggleStatus,
  error,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    propertyType: 'all',
    priceRange: 'all',
    searchTerm: '',
  });
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('earnings');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const propertyTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'condo', label: 'Condo' },
    { value: 'villa', label: 'Villa' },
    { value: 'cabin', label: 'Cabin' },
    { value: 'loft', label: 'Loft' },
  ];

  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: '0-100', label: '$0 - $100' },
    { value: '100-300', label: '$100 - $300' },
    { value: '300-500', label: '$300 - $500' },
    { value: '500+', label: '$500+' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Maintenance' },
  ];

  // Filter and sort properties
  const filteredAndSortedProperties = useMemo(() => {
    const filtered = properties.filter((property) => {
      const searchMatch =
        property.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const statusMatch = filters.status === 'all' || property.status === filters.status;
      const typeMatch =
        filters.propertyType === 'all' || property.propertyType === filters.propertyType;

      let priceMatch = true;
      if (filters.priceRange !== 'all') {
        const [min, max] = filters.priceRange.split('-').map(Number);
        if (filters.priceRange === '500+') {
          priceMatch = property.price >= 500;
        } else {
          priceMatch = property.price >= min && property.price <= max;
        }
      }

      return searchMatch && statusMatch && typeMatch && priceMatch;
    });

    // Sort properties
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'earnings':
          comparison = a.earnings - b.earnings;
          break;
        case 'bookings':
          comparison = a.bookings - b.bookings;
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [properties, filters, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = properties.length;
    const active = properties.filter((p) => p.status === 'active').length;
    const inactive = properties.filter((p) => p.status === 'inactive').length;
    const maintenance = properties.filter((p) => p.status === 'maintenance').length;
    const totalEarnings = properties.reduce((sum, p) => sum + p.earnings, 0);
    const totalBookings = properties.reduce((sum, p) => sum + p.bookings, 0);
    const averageRating = properties.reduce((sum, p) => sum + (p.rating || 0), 0) / total || 0;

    return {
      total,
      active,
      inactive,
      maintenance,
      totalEarnings,
      totalBookings,
      averageRating: averageRating.toFixed(1),
    };
  }, [properties]);

  const getStatusColor = (status: Property['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Property['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'inactive':
        return <XCircle className="w-4 h-4" />;
      case 'maintenance':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setShowEditModal(true);
  };

  const handleViewAnalytics = (property: Property) => {
    setSelectedProperty(property);
    setShowAnalyticsModal(true);
  };

  const handleViewCalendar = (property: Property) => {
    setSelectedProperty(property);
    setShowCalendarModal(true);
  };

  const PropertyCard = ({ property }: { property: Property }) => (
    <div className="bg-white dark:bg-[#0B1D39] rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative">
        <Image
          src={property.image}
          alt={property.title}
          width={400}
          height={200}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(property.status)}`}
          >
            {getStatusIcon(property.status)}
            <span className="ml-1 capitalize">{property.status}</span>
          </span>
        </div>
        <div className="absolute top-4 left-4">
          <span className="bg-black/70 text-white px-2 py-1 rounded text-sm font-bold">
            ${property.price}/night
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-1 line-clamp-2">
              {property.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {property.location}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm dark:text-gray-300 text-gray-600">
            <span className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              {property.bedrooms} bed
            </span>
            <span className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              {property.bathrooms} bath
            </span>
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {property.guests} guests
            </span>
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm font-medium">{property.rating}</span>
            <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
              ({property.reviews})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <p className="text-lg font-bold dark:text-white text-gray-900">{property.bookings}</p>
            <p className="text-sm dark:text-gray-400 text-gray-600">Bookings</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">${property.earnings}</p>
            <p className="text-sm dark:text-gray-400 text-gray-600">Earned</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => handleViewCalendar(property)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </button>
          <button
            type="button"
            onClick={() => handleViewAnalytics(property)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleEditProperty(property)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              onToggleStatus(property.id, property.status === 'active' ? 'inactive' : 'active')
            }
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const PropertyList = ({ property }: { property: Property }) => (
    <div className="bg-white dark:bg-[#0B1D39] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center p-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <Image
            src={property.image}
            alt={property.title}
            fill
            className="object-cover rounded-lg"
          />
          <div className="absolute -top-1 -right-1">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(property.status)}`}
            >
              {getStatusIcon(property.status)}
            </span>
          </div>
        </div>

        <div className="ml-4 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{property.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {property.location}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600">${property.price}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">per night</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center">
                <Bed className="w-3 h-3 mr-1" />
                {property.bedrooms} bed
              </span>
              <span className="flex items-center">
                <Bath className="w-3 h-3 mr-1" />
                {property.bathrooms} bath
              </span>
              <span className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                {property.guests} guests
              </span>
              <span className="flex items-center">
                <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                {property.rating}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">{property.bookings} bookings</span>
              <span className="text-green-600 font-medium">${property.earnings}</span>
            </div>
          </div>
        </div>

        <div className="ml-4 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleViewCalendar(property)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleViewAnalytics(property)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleEditProperty(property)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              onToggleStatus(property.id, property.status === 'active' ? 'inactive' : 'active')
            }
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <X className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-[#0B1D39] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <Home className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#0B1D39] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#0B1D39] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inactive</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
            </div>
            <XCircle className="w-8 h-8 text-gray-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#0B1D39] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Maintenance</p>
              <p className="text-2xl font-bold text-orange-600">{stats.maintenance}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#0B1D39] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalBookings}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#0B1D39] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.averageRating}</p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#0B1D39] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600">
                ${stats.totalEarnings.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Header with Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">My Properties</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your listings and track performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Property
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-[#0B1D39] rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Property Type Filter */}
            <select
              value={filters.propertyType}
              onChange={(e) => handleFilterChange('propertyType', e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {propertyTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Price Range Filter */}
            <select
              value={filters.priceRange}
              onChange={(e) => handleFilterChange('priceRange', e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {priceRanges.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as [
                  string,
                  'asc' | 'desc',
                ];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="earnings-desc">Earnings (High to Low)</option>
              <option value="earnings-asc">Earnings (Low to High)</option>
              <option value="bookings-desc">Bookings (High to Low)</option>
              <option value="bookings-asc">Bookings (Low to High)</option>
              <option value="rating-desc">Rating (High to Low)</option>
              <option value="rating-asc">Rating (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="title-asc">Name (A-Z)</option>
              <option value="title-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredAndSortedProperties.length} of {properties.length} properties
          </p>
        </div>

        {/* Properties Display */}
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading properties...</p>
          </div>
        ) : filteredAndSortedProperties.length === 0 ? (
          <div className="p-12 text-center">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No properties found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {properties.length === 0
                ? "You don't have any properties yet"
                : 'Try adjusting your search or filters'}
            </p>
            {properties.length === 0 && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Property
              </button>
            )}
          </div>
        ) : (
          <div className="p-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredAndSortedProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedProperties.map((property) => (
                  <PropertyList key={property.id} property={property} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0B1D39] rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Add New Property
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Property Title
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      placeholder="Enter property title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      placeholder="Enter location"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price per Night
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Property Type
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium">
                      <option value="">Select type</option>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="villa">Villa</option>
                      <option value="cabin">Cabin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Guests
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="Describe your property..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Property Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Click to upload or drag and drop
                    </p>
                    <input type="file" className="hidden" accept="image/*" />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {showEditModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0B1D39] rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Property</h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Property Title
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedProperty.title}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedProperty.location}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price per Night
                    </label>
                    <input
                      type="number"
                      defaultValue={selectedProperty.price}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      defaultValue={selectedProperty.status}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    defaultValue={selectedProperty.description}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendarModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0B1D39] rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Availability Calendar - {selectedProperty.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calendar View */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Calendar
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-80 flex items-center justify-center">
                    <div className="text-center">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Calendar component will be implemented here
                      </p>
                    </div>
                  </div>
                </div>

                {/* Availability Settings */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Availability Settings
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Minimum Stay (nights)
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Advance Booking (days)
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        placeholder="30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Instant Booking
                      </label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Allow instant booking
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0B1D39] rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Analytics - {selectedProperty.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAnalyticsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Total Earnings
                      </p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        ${selectedProperty.earnings}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        Total Bookings
                      </p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {selectedProperty.bookings}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        Average Rating
                      </p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {selectedProperty.rating}
                      </p>
                    </div>
                    <Star className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        Occupancy Rate
                      </p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {selectedProperty.occupancyRate || 75}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Earnings Trend
                  </h4>
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Earnings chart will be displayed here
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Booking Distribution
                  </h4>
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Booking distribution chart will be displayed here
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAnalyticsModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagement;
