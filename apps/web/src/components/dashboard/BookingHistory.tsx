'use client';

import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Star,
  Filter,
  Search,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { Booking, FilterState } from '../../types/shared';

interface BookingHistoryProps {
  bookings: Booking[];
  onCancelBooking: (bookingId: string) => Promise<void>;
  onViewDetails?: (booking: Booking) => void;
  onContactHost?: (booking: Booking) => void;
  onLeaveReview?: (booking: Booking) => void;
  isLoading?: boolean;
  error?: string | null;
}

const BookingHistory: React.FC<BookingHistoryProps> = ({
  bookings,
  onCancelBooking,
  onViewDetails,
  onContactHost,
  onLeaveReview,
  isLoading = false,
  error = null,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    dateRange: 'all',
    searchTerm: '',
    sortBy: 'bookingDate',
    sortOrder: 'desc',
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
  ];

  const sortOptions = [
    { value: 'bookingDate-desc', label: 'Booking Date (Newest)' },
    { value: 'bookingDate-asc', label: 'Booking Date (Oldest)' },
    { value: 'checkIn-desc', label: 'Check-in (Latest)' },
    { value: 'checkIn-asc', label: 'Check-in (Earliest)' },
    { value: 'totalAmount-desc', label: 'Amount (High to Low)' },
    { value: 'totalAmount-asc', label: 'Amount (Low to High)' },
    { value: 'propertyTitle-asc', label: 'Property Name (A-Z)' },
    { value: 'propertyTitle-desc', label: 'Property Name (Z-A)' },
  ];

  // Filter and sort bookings
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings.filter((booking) => {
      const searchMatch =
        booking.propertyTitle.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        booking.location.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const statusMatch = filters.status === 'all' || booking.status === filters.status;

      let dateMatch = true;
      const now = new Date();
      const checkInDate = new Date(booking.checkIn);
      const checkOutDate = new Date(booking.checkOut);

      switch (filters.dateRange) {
        case 'upcoming':
          dateMatch = checkInDate > now;
          break;
        case 'past':
          dateMatch = checkOutDate < now;
          break;
        case 'this-month':
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          dateMatch = checkInDate >= thisMonthStart && checkInDate <= thisMonthEnd;
          break;
        case 'last-month':
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          dateMatch = checkInDate >= lastMonthStart && checkInDate <= lastMonthEnd;
          break;
      }

      return searchMatch && statusMatch && dateMatch;
    });

    // Sort bookings
    const [sortBy, sortOrder] = filters.sortBy.split('-') as [string, 'asc' | 'desc'];
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'bookingDate':
          comparison = new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime();
          break;
        case 'checkIn':
          comparison = new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
          break;
        case 'totalAmount':
          comparison = a.totalAmount - b.totalAmount;
          break;
        case 'propertyTitle':
          comparison = a.propertyTitle.localeCompare(b.propertyTitle);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [bookings, filters]);

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      await onCancelBooking(selectedBooking.id);
      setShowCancelModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
    onViewDetails?.(booking);
  };

  const handleContactHost = (booking: Booking) => {
    onContactHost?.(booking);
  };

  const handleLeaveReview = (booking: Booking) => {
    onLeaveReview?.(booking);
  };

  const exportBookings = () => {
    const csvContent = [
      ['Property', 'Location', 'Check-in', 'Check-out', 'Guests', 'Amount', 'Status', 'Booking Date'],
      ...filteredAndSortedBookings.map(booking => [
        booking.propertyTitle,
        booking.location,
        booking.checkIn,
        booking.checkOut,
        booking.guests.toString(),
        `$${booking.totalAmount}`,
        booking.status,
        booking.bookingDate,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <XCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Booking History</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your bookings and view past stays
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
            onClick={exportBookings}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center font-medium"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
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
                placeholder="Search bookings..."
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

            {/* Date Range Filter */}
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
            >
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredAndSortedBookings.length} of {bookings.length} bookings
          </p>
        </div>

        {/* Bookings Display */}
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading bookings...</p>
          </div>
        ) : filteredAndSortedBookings.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No bookings found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {bookings.length === 0
                ? "You don't have any bookings yet"
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="p-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={() => {
                      setSelectedBooking(booking);
                      setShowCancelModal(true);
                    }}
                    onViewDetails={() => handleViewDetails(booking)}
                    onContactHost={() => handleContactHost(booking)}
                    onLeaveReview={() => handleLeaveReview(booking)}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    formatDate={formatDate}
                    calculateNights={calculateNights}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedBookings.map((booking) => (
                  <BookingListItem
                    key={booking.id}
                    booking={booking}
                    onCancel={() => {
                      setSelectedBooking(booking);
                      setShowCancelModal(true);
                    }}
                    onViewDetails={() => handleViewDetails(booking)}
                    onContactHost={() => handleContactHost(booking)}
                    onLeaveReview={() => handleLeaveReview(booking)}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    formatDate={formatDate}
                    calculateNights={calculateNights}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Booking Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0B1D39] rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cancel Booking</h3>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to cancel your booking for{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedBooking.propertyTitle}
                </span>
                ?
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium">Cancellation Policy</p>
                    <p>You may be charged a cancellation fee depending on the property's policy.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0B1D39] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Booking Details</h3>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Property Image */}
                <div className="relative h-48 rounded-lg overflow-hidden">
                  <Image
                    src={selectedBooking.propertyImage}
                    alt={selectedBooking.propertyTitle}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Property Info */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedBooking.propertyTitle}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {selectedBooking.location}
                  </p>
                </div>

                {/* Booking Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Stay Details</h5>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Check-in:</span>
                        <span>{formatDate(selectedBooking.checkIn)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Check-out:</span>
                        <span>{formatDate(selectedBooking.checkOut)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{calculateNights(selectedBooking.checkIn, selectedBooking.checkOut)} nights</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Guests:</span>
                        <span>{selectedBooking.guests}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Payment Details</h5>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${selectedBooking.totalAmount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Booking Date:</span>
                        <span>{formatDate(selectedBooking.bookingDate)}</span>
                      </div>
                      {selectedBooking.escrowAddress && (
                        <div className="flex justify-between">
                          <span>Escrow Address:</span>
                          <span className="font-mono text-xs">{selectedBooking.escrowAddress.slice(0, 8)}...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">Status</h5>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      selectedBooking.status
                    )}`}
                  >
                    {getStatusIcon(selectedBooking.status)}
                    <span className="ml-1 capitalize">{selectedBooking.status}</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => handleViewDetails(selectedBooking)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Property
                  </button>
                  {selectedBooking.canCancel && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowDetailsModal(false);
                        setShowCancelModal(true);
                      }}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancel Booking
                    </button>
                  )}
                  {selectedBooking.canReview && (
                    <button
                      type="button"
                      onClick={() => handleLeaveReview(selectedBooking)}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Leave Review
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleContactHost(selectedBooking)}
                    className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Host
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Booking Card Component
const BookingCard: React.FC<{
  booking: Booking;
  onCancel: () => void;
  onViewDetails: () => void;
  onContactHost: () => void;
  onLeaveReview: () => void;
  getStatusColor: (status: Booking['status']) => string;
  getStatusIcon: (status: Booking['status']) => React.ReactNode;
  formatDate: (date: string) => string;
  calculateNights: (checkIn: string, checkOut: string) => number;
}> = ({
  booking,
  onCancel,
  onViewDetails,
  onContactHost,
  onLeaveReview,
  getStatusColor,
  getStatusIcon,
  formatDate,
  calculateNights,
}) => (
  <div className="bg-white dark:bg-[#0B1D39] rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
    <div className="relative">
      <Image
        src={booking.propertyImage}
        alt={booking.propertyTitle}
        width={400}
        height={200}
        className="w-full h-48 object-cover"
      />
      <div className="absolute top-4 right-4">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
            booking.status
          )}`}
        >
          {getStatusIcon(booking.status)}
          <span className="ml-1 capitalize">{booking.status}</span>
        </span>
      </div>
    </div>

    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-1 line-clamp-2">
          {booking.propertyTitle}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          {booking.location}
        </p>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Check-in:</span>
          <span className="font-medium dark:text-white">{formatDate(booking.checkIn)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Check-out:</span>
          <span className="font-medium dark:text-white">{formatDate(booking.checkOut)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Duration:</span>
          <span className="font-medium dark:text-white">
            {calculateNights(booking.checkIn, booking.checkOut)} nights
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Guests:</span>
          <span className="font-medium dark:text-white">{booking.guests}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total:</span>
          <span className="font-bold text-green-600">${booking.totalAmount}</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          type="button"
          onClick={onViewDetails}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <Eye className="w-4 h-4 mr-2" />
          Details
        </button>
        {booking.canCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        {booking.canReview && (
          <button
            type="button"
            onClick={onLeaveReview}
            className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Star className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  </div>
);

// Booking List Item Component
const BookingListItem: React.FC<{
  booking: Booking;
  onCancel: () => void;
  onViewDetails: () => void;
  onContactHost: () => void;
  onLeaveReview: () => void;
  getStatusColor: (status: Booking['status']) => string;
  getStatusIcon: (status: Booking['status']) => React.ReactNode;
  formatDate: (date: string) => string;
  calculateNights: (checkIn: string, checkOut: string) => number;
}> = ({
  booking,
  onCancel,
  onViewDetails,
  onContactHost,
  onLeaveReview,
  getStatusColor,
  getStatusIcon,
  formatDate,
  calculateNights,
}) => (
  <div className="bg-white dark:bg-[#0B1D39] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
    <div className="flex items-center p-4">
      <div className="relative w-20 h-20 flex-shrink-0">
        <Image
          src={booking.propertyImage}
          alt={booking.propertyTitle}
          fill
          className="object-cover rounded-lg"
        />
        <div className="absolute -top-1 -right-1">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}
          >
            {getStatusIcon(booking.status)}
          </span>
        </div>
      </div>

      <div className="ml-4 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{booking.propertyTitle}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {booking.location}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">${booking.totalAmount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {calculateNights(booking.checkIn, booking.checkOut)} nights
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
            </span>
            <span className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {booking.guests} guests
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Booked {formatDate(booking.bookingDate)}
            </span>
          </div>
        </div>
      </div>

      <div className="ml-4 flex items-center space-x-2">
        <button
          type="button"
          onClick={onViewDetails}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <Eye className="w-4 h-4" />
        </button>
        {booking.canCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        {booking.canReview && (
          <button
            type="button"
            onClick={onLeaveReview}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
          >
            <Star className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onContactHost}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

export default BookingHistory; 