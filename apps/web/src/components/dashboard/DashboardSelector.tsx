// apps/web/src/components/dashboard/DashboardSelector.tsx
import { Home, User } from 'lucide-react';
import Link from 'next/link';

export function DashboardSelector() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-center mb-8">
          Choose Your Dashboard
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/dashboard/guest">
            <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
              <User className="w-12 h-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Guest Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-300">
                View your bookings, trips, and reservations
              </p>
            </div>
          </Link>

          <Link href="/dashboard/host">
            <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500">
              <Home className="w-12 h-12 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Host Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Manage properties, bookings, and earnings
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}