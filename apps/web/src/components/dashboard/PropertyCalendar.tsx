'use client';

import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Check,
  X,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  Download,
  Filter,
} from 'lucide-react';
import { useState, useMemo } from 'react';

interface Booking {
  id: string;
  checkIn: Date;
  checkOut: Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  guestName: string;
  guests: number;
  totalAmount: number;
  propertyId: number;
}

interface PropertyCalendarProps {
  propertyId: number;
  propertyName: string;
  bookings: Booking[];
  onAddBooking: (booking: Omit<Booking, 'id'>) => void;
  onUpdateBooking: (id: string, booking: Partial<Booking>) => void;
  onDeleteBooking: (id: string) => void;
  onBlockDates: (dates: Date[]) => void;
  onUnblockDates: (dates: Date[]) => void;
  isLoading?: boolean;
  error?: string | null;
}

const PropertyCalendar: React.FC<PropertyCalendarProps> = ({
  propertyId,
  propertyName,
  bookings,
  onAddBooking,
  onUpdateBooking,
  onDeleteBooking,
  onBlockDates,
  onUnblockDates,
  isLoading = false,
  error,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');

  const statusOptions = [
    { value: 'all', label: 'All Bookings' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  // Get current month/year
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const firstDayWeekday = firstDayOfMonth.getDay();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }
    
    return days;
  }, [currentYear, currentMonth, firstDayWeekday, daysInMonth]);

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      return date >= checkIn && date < checkOut;
    });
  };

  // Check if date is selected
  const isDateSelected = (date: Date) => {
    return selectedDates.some(selectedDate => 
      selectedDate.toDateString() === date.toDateString()
    );
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (isDateSelected(date)) {
      setSelectedDates(selectedDates.filter(d => d.toDateString() !== date.toDateString()));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get status color
  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return <Check className="w-3 h-3" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'cancelled':
        return <X className="w-3 h-3" />;
      case 'completed':
        return <Check className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  // Filter bookings based on status
  const filteredBookings = useMemo(() => {
    if (filterStatus === 'all') return bookings;
    return bookings.filter(booking => booking.status === filterStatus);
  }, [bookings, filterStatus]);

  // Export calendar data
  const exportCalendar = () => {
    const csvContent = [
      ['Date', 'Guest Name', 'Check-in', 'Check-out', 'Status', 'Guests', 'Amount'],
      ...filteredBookings.map(booking => [
        new Date(booking.checkIn).toLocaleDateString(),
        booking.guestName,
        new Date(booking.checkIn).toLocaleDateString(),
        new Date(booking.checkOut).toLocaleDateString(),
        booking.status,
        booking.guests.toString(),
        `$${booking.totalAmount}`,
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${propertyName}-calendar-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

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
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Property Calendar</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{propertyName}</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={exportCalendar}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Booking
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white dark:bg-[#0B1D39] rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={goToToday}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Today
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={index} className="p-2" />;
            }

            const dayBookings = getBookingsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = isDateSelected(date);
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <div
                key={index}
                onClick={() => handleDateClick(date)}
                className={`p-2 min-h-[100px] border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${
                  isToday
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
                    : isSelected
                    ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-500'
                    : isPast
                    ? 'bg-gray-50 dark:bg-gray-800'
                    : 'bg-white dark:bg-[#0B1D39] hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayBookings.slice(0, 2).map((booking) => (
                    <div
                      key={booking.id}
                      className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(booking.status)} flex items-center justify-between`}
                    >
                      <span className="truncate">{booking.guestName}</span>
                      {getStatusIcon(booking.status)}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{dayBookings.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Dates Actions */}
      {selectedDates.length > 0 && (
        <div className="bg-white dark:bg-[#0B1D39] rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Selected Dates ({selectedDates.length})
          </h3>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => onBlockDates(selectedDates)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              Block Dates
            </button>
            <button
              type="button"
              onClick={() => onUnblockDates(selectedDates)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Check className="w-4 h-4 mr-2" />
              Unblock Dates
            </button>
            <button
              type="button"
              onClick={() => setSelectedDates([])}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Upcoming Bookings */}
      <div className="bg-white dark:bg-[#0B1D39] rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Bookings</h3>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No upcoming bookings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings
              .filter(booking => new Date(booking.checkIn) >= new Date())
              .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
              .slice(0, 10)
              .map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{booking.guestName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ${booking.totalAmount}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowEditModal(true);
                        }}
                        className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteBooking(booking.id)}
                        className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* TODO: Add Booking Modal */}
      {/* TODO: Edit Booking Modal */}
    </div>
  );
};

export default PropertyCalendar; 