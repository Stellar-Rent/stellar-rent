'use client';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useAuth } from '@/hooks/auth/use-auth';
import { ArrowRight, Home, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardSelector } from '~/components/dashboard/DashboardSelector';
import { useUserRole } from '~/hooks/useUserRole';

export default function DashboardPage() {
  const { role, canAccessHostDashboard, isLoading } = useUserRole();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading || isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (role === 'host' && canAccessHostDashboard) {
      router.replace('/dashboard/host-dashboard');
    } else if (role === 'guest') {
      router.replace('/dashboard/tenant-dashboard');
    }
  }, [role, canAccessHostDashboard, router, isLoading, isAuthenticated, isAuthLoading]);

  if (isLoading || isAuthLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  if (role === 'host' && !canAccessHostDashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome, Host!</h1>
        <p className="mb-4">
          You don't have any properties yet. Please create a property to access the host dashboard.
        </p>
        <Link
          href="/add-property"
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Create Property
        </Link>
      </div>
    );
  }

  if (role === 'dual') {
    return <DashboardSelector />;
  }

  // Default dashboard selection UI (from main)
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-[#0B1D39] dark:to-[#071429]">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb className="mb-8" />
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome back, {user?.name || 'User'}! 👋
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
                Browse properties, manage bookings, and track your stays seamlessly.
              </p>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                  Explore Listings
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                  Booking Management
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  Payment History
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
