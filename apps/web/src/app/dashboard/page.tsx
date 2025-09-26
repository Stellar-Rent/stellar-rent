'use client';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useAuth } from '@/hooks/auth/use-auth';
import { ArrowRight, Home, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const DashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-[#0B1D39] dark:to-[#071429]">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb className="mb-8" />
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Choose your dashboard to get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/dashboard/host-dashboard">
            <div className="bg-white dark:bg-[#0B1D39]/90 rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 group cursor-pointer">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Home className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Host Dashboard
              </h3>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Manage your properties, view bookings, track earnings, and handle your rental
                business.
              </p>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                  Property Management
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                  Booking History
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  Earnings Analytics
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/tenant-dashboard">
            <div className="bg-white dark:bg-[#0B1D39]/90 rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 group cursor-pointer">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Tenant Dashboard
              </h3>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                View your bookings, manage your profile, track payments, and explore travel
                analytics.
              </p>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                  My Bookings
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                  Wallet & Payments
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  Travel Analytics
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Need help? Contact our support team
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
