import { Calendar, Clock, CreditCard, Eye, MapPin, Star } from 'lucide-react';
import Image from 'next/image';
import type { LegacyBooking as Booking } from '@/types';

interface BookingCardProps {
  booking: Booking;
  onViewDetails: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onViewDetails, onCancel }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'ongoing':
        return <CreditCard className="w-3 h-3 mr-1" />;
      case 'completed':
        return <Star className="w-3 h-3 mr-1" />;
      case 'cancelled':
        return <div className="w-3 h-3 mr-1 rounded-full bg-red-500" />;
      default:
        return null;
    }
  };

  const isRecentBooking = () => {
    const bookingDate = new Date(booking.bookingDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - bookingDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const isUpcoming = () => {
    const checkInDate = new Date(booking.checkIn);
    const now = new Date();
    return checkInDate > now;
  };

  return (
    <div className="bg-white dark:bg-[#0B1D39] rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col group">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={booking.propertyImage}
          alt={booking.propertyTitle}
          width={400}
          height={192}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(booking.status)}`}
          >
            {getStatusIcon(booking.status)}
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>
        {isRecentBooking() && (
          <div className="absolute top-3 right-3">
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              New
            </span>
          </div>
        )}
        <div className="absolute bottom-3 right-3">
          <span className="bg-black/70 text-white px-2 py-1 rounded-lg text-sm font-bold">
            ${booking.totalAmount}
          </span>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-3">
          <h3 className="text-lg font-bold dark:text-white text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {booking.propertyTitle}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 flex items-center text-sm mb-1">
            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
            {booking.propertyLocation}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Host: {booking.hostName}</p>
        </div>
        <div className="mb-4 text-xs text-gray-600 dark:text-gray-300 space-y-2">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>
              {new Date(booking.checkIn).toLocaleDateString()} -{' '}
              {new Date(booking.checkOut).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center">
              <span className="font-medium">{booking.guests}</span>
              <span className="ml-1">{booking.guests === 1 ? 'guest' : 'guests'}</span>
            </span>
            {booking.rating && (
              <div className="flex items-center">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="ml-1 font-medium">{booking.rating}</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Booked: {new Date(booking.bookingDate).toLocaleDateString()}
          </div>
        </div>
        <div className="mt-auto space-y-2">
          <button
            type="button"
            onClick={() => onViewDetails(booking)}
            className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm font-medium"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </button>
          {booking.canCancel && booking.status === 'upcoming' && (
            <button
              type="button"
              onClick={() => onCancel(booking)}
              className="w-full bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              Cancel Booking
            </button>
          )}
          {booking.status === 'completed' && (
            <button
              type="button"
              onClick={() => onViewDetails(booking)}
              className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Leave Review
            </button>
          )}

          {booking.status === 'ongoing' && (
            <button
              type="button"
              onClick={() => onViewDetails(booking)}
              className="w-full bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
            >
              Contact Host
            </button>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Booking #{booking.id}</span>
            {isUpcoming() && booking.status === 'upcoming' && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {Math.ceil(
                  (new Date(booking.checkIn).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )}{' '}
                days to go
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
