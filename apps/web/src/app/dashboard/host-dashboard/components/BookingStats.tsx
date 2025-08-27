import { Calendar, Check, CheckCircle, Clock } from 'lucide-react';
import type { Booking } from '../types';

interface BookingStatsProps {
  bookings: Booking[];
}

export const BookingStats = ({ bookings }: BookingStatsProps) => {
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length;
  const completedBookings = bookings.filter((b) => b.status === 'completed').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white dark:bg-card/90 dark:text-foreground shadow p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium dark:text-white text-gray-600">Total Bookings</p>
            <p className="text-3xl font-bold dark:text-white text-gray-900">{totalBookings}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-card/90 dark:text-foreground p-6 rounded-xl shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium dark:text-white text-gray-600">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingBookings}</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-card/90 dark:text-foreground p-6 rounded-xl shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium dark:text-white text-gray-600">Confirmed</p>
            <p className="text-3xl font-bold text-blue-600">{confirmedBookings}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <CheckCircle className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-card/90 dark:text-foreground p-6 rounded-xl shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium dark:text-white text-gray-600">Completed</p>
            <p className="text-3xl font-bold text-green-600">{completedBookings}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <Check className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  );
};
