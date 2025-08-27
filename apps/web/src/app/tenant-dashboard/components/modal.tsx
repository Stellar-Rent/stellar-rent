import { Calendar, MapPin, X } from 'lucide-react';
import Image from 'next/image';
import type { LegacyBooking as Booking } from '@/types';

interface BookingModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onCancel: (booking: Booking) => void;
}

interface CancelModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bookingId: number) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  booking,
  isOpen,
  onClose,
  onCancel,
}) => {
  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0B1D39] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Booking Details</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <Image
              src={booking.propertyImage}
              alt={booking.propertyTitle}
              width={600}
              height={192}
              className="w-full h-48 object-cover rounded-lg"
            />

            <div>
              <h3 className="text-xl font-bold dark:text-white text-gray-900">
                {booking.propertyTitle}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {booking.propertyLocation}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Host: {booking.hostName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="check-in-display"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Check-in
                </label>
                <p
                  id="check-in-display"
                  className="text-gray-900 dark:text-white flex items-center"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(booking.checkIn).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label
                  htmlFor="check-out-display"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Check-out
                </label>
                <p
                  id="check-out-display"
                  className="text-gray-900 dark:text-white flex items-center"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(booking.checkOut).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label
                  htmlFor="guests-display"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Guests
                </label>
                <p id="guests-display" className="text-gray-900 dark:text-white">
                  {booking.guests} guests
                </p>
              </div>
              <div>
                <label
                  htmlFor="total-amount-display"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Total Amount
                </label>
                <p
                  id="total-amount-display"
                  className="text-gray-900 dark:text-white font-bold text-lg"
                >
                  ${booking.totalAmount}
                </p>
              </div>
              <div>
                <label
                  htmlFor="status-display"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Status
                </label>
                <span
                  id="status-display"
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    booking.status === 'upcoming'
                      ? 'bg-blue-100 text-blue-800'
                      : booking.status === 'ongoing'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'completed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                  }`}
                >
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
              <div>
                <label
                  htmlFor="booking-date-display"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Booking Date
                </label>
                <p id="booking-date-display" className="text-gray-900 dark:text-white">
                  {new Date(booking.bookingDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {booking.canCancel && booking.status === 'upcoming' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCancel(booking);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CancelModal: React.FC<CancelModalProps> = ({
  booking,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0B1D39] rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cancel Booking</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Are you sure you want to cancel your booking for &quot;
            {booking.propertyTitle}&quot;? This action cannot be undone and may result in
            cancellation fees.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Cancellation Policy:</strong> Cancellations made more than 24 hours before
              check-in may be eligible for a partial refund.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Keep Booking
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm(booking.id);
                onClose();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancel Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
