'use client';

import BookingHistory from '@/components/dashboard/BookingHistory';
import NotificationSystem from '@/components/dashboard/NotificationSystem';
import ProfileManagement from '@/components/dashboard/ProfileManagement';
import { ErrorDisplay } from '@/components/ui/error-display';
import { LoadingGrid } from '@/components/ui/loading-skeleton';
import RoleGuard from '@/hooks/auth/RoleGuard';
import { useDashboard } from '@/hooks/useDashboard';
import type { UserProfile as ApiUserProfile } from '@/types';
import type { UserProfile } from '@/types/shared';
import type { Booking } from '@/types/shared';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bath,
  Bed,
  Bell,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Edit3,
  Eye,
  Filter,
  Home,
  Info,
  Loader2,
  MapPin,
  MessageSquare,
  PieChart,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Star,
  Trash2,
  TrendingUp,
  User,
  Users,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import { useEffect, useState } from 'react';

const mockTransactions = [
  {
    id: 1,
    date: '2025-05-28',
    description: 'Luxury Downtown Apartment',
    amount: -1250,
    type: 'booking',
    status: 'completed',
  },
  {
    id: 2,
    date: '2025-05-26',
    description: 'Cozy Beach House',
    amount: -900,
    type: 'booking',
    status: 'pending',
  },
  {
    id: 3,
    date: '2025-05-20',
    description: 'Wallet Top-up',
    amount: 2000,
    type: 'deposit',
    status: 'completed',
  },
  {
    id: 4,
    date: '2025-05-15',
    description: 'Mountain Cabin Retreat',
    amount: -1600,
    type: 'booking',
    status: 'completed',
  },
];

const TenantDashboard = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [transactions, _setTransactions] = useState(mockTransactions);
  const [walletBalance, _setWalletBalance] = useState(2500);

  const {
    bookings: apiBookings,
    user: apiUser,
    isLoadingBookings,
    isLoadingProfile,
    bookingsError,
    profileError,
    // error: generalError,
    refetchAll,
    cancelBooking: apiCancelBooking,
    updateProfile: apiUpdateProfile,
    uploadAvatar: apiUploadAvatar,
    deleteAccount: apiDeleteAccount,
  } = useDashboard({ userId: 'tenant-1', userType: 'tenant' });

  interface LocalNotification {
    id: string;
    type: 'booking' | 'payment' | 'review' | 'system' | 'message' | 'reminder';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    priority: 'low' | 'medium' | 'high';
    actionUrl?: string;
    actionText?: string;
  }

  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const user = apiUser || null;
  const bookings: Booking[] = apiBookings.map((b) => ({
    id: b.id,
    propertyTitle: b.propertyTitle,
    propertyImage: b.propertyImage,
    location: b.propertyLocation,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    guests: b.guests,
    totalAmount: b.totalAmount,
    status: b.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
    bookingDate: b.bookingDate,
    propertyId: '1',
    canCancel: true,
    canReview: b.status === 'completed',
  }));

  const stats = {
    totalBookings: bookings.length,
    upcomingBookings: bookings.filter(
      (b) => b.status === 'confirmed' && new Date(b.checkIn) > new Date()
    ).length,
    completedBookings: bookings.filter((b) => b.status === 'completed').length,
    totalSpent: user?.totalSpent || 0,
    averageRating: 4.8,
    memberSince: user?.memberSince || '2023',
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadNotifications((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
    setUnreadNotifications(0);
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    setUnreadNotifications((prev) => Math.max(0, prev - 1));
  };

  const handleDeleteAllNotifications = () => {
    setNotifications([]);
    setUnreadNotifications(0);
  };

  const handleRefresh = async () => {
    await refetchAll();
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await apiCancelBooking(bookingId);
      const newNotification = {
        id: Date.now().toString(),
        type: 'booking' as const,
        title: 'Booking Cancelled',
        message: 'Your booking has been successfully cancelled',
        timestamp: new Date(),
        read: false,
        priority: 'medium' as const,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadNotifications((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!apiUser) return;
      const safeUpdates = {
        ...updates,
        preferences: updates.preferences
          ? {
              currency: apiUser.preferences?.currency || 'USD',
              language: apiUser.preferences?.language || 'en',
              notifications: updates.preferences.notifications,
              emailNotifications: updates.preferences.emailUpdates,
              marketingEmails: apiUser.preferences?.marketingEmails,
            }
          : apiUser.preferences,
      };
      await apiUpdateProfile({ ...apiUser, ...safeUpdates } as unknown as ApiUserProfile);
      const newNotification = {
        id: Date.now().toString(),
        type: 'system' as const,
        title: 'Profile Updated',
        message: 'Your profile has been successfully updated',
        timestamp: new Date(),
        read: false,
        priority: 'low' as const,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadNotifications((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleUploadAvatar = async (file: File) => {
    try {
      if (!user) return;
      await apiUploadAvatar(user.id.toString(), file);
      const newNotification = {
        id: Date.now().toString(),
        type: 'system' as const,
        title: 'Avatar Updated',
        message: 'Your profile picture has been successfully updated',
        timestamp: new Date(),
        read: false,
        priority: 'low' as const,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadNotifications((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    }
  };

  return (
    <RoleGuard requiredRole="guest">
      <div className="min-h-screen bg-gray-50 bg-gradient-to-b from-white to-blue-50 dark:from-[#0B1D39] dark:to-[#071429] dark:text-white">
        <header className="bg-white dark:bg-card/90 dark:text-foreground shadow-sm border-b">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Tenant Dashboard
                </h1>
                {(isLoadingBookings || isLoadingProfile) && (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500 ml-3" />
                )}
              </div>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="text-gray-500 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <RefreshCw
                    className={`w-6 h-6 ${isLoadingBookings || isLoadingProfile ? 'animate-spin' : ''}`}
                  />
                </button>
                <NotificationSystem
                  notifications={notifications}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onDeleteNotification={handleDeleteNotification}
                  onDeleteAllNotifications={handleDeleteAllNotifications}
                  unreadCount={unreadNotifications}
                />
                <button type="button" className="text-gray-500 dark:text-white">
                  <Settings className="w-6 h-6" />
                </button>
                {user && (
                  <div className="flex items-center space-x-3">
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-white">
                      {user.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="w-full px-4 sm:px-6 lg:px-8 mt-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'bookings', label: 'My Bookings', icon: Calendar },
                { id: 'wallet', label: 'Wallet', icon: Wallet },
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-white hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'bookings' && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold dark:text-white text-gray-900">My Bookings</h2>
                <p className="text-gray-600 dark:text-white mt-1">
                  Manage your upcoming and past bookings
                </p>
              </div>

              {bookingsError ? (
                <ErrorDisplay
                  message={bookingsError}
                  onRetry={handleRefresh}
                  title="Failed to load bookings"
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-card/90 dark:text-foreground shadow p-6 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium dark:text-white text-gray-600">
                            Total Bookings
                          </p>
                          <p className="text-3xl font-bold dark:text-white text-gray-900">
                            {stats.totalBookings}
                          </p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                          <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-card/90 dark:text-foreground p-6 rounded-xl shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium dark:text-white text-gray-600">
                            Upcoming
                          </p>
                          <p className="text-3xl font-bold text-blue-600">
                            {stats.upcomingBookings}
                          </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-card/90 dark:text-foreground p-6 rounded-xl shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium dark:text-white text-gray-600">
                            Completed
                          </p>
                          <p className="text-3xl font-bold text-green-600">
                            {stats.completedBookings}
                          </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                          <Check className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-card/90 dark:text-foreground p-6 rounded-xl shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium dark:text-white text-gray-600">
                            Total Spent
                          </p>
                          <p className="text-3xl font-bold text-green-600">${stats.totalSpent}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <BookingHistory
                    bookings={bookings}
                    onCancelBooking={handleCancelBooking}
                    isLoading={isLoadingBookings}
                    onRefresh={handleRefresh}
                  />
                </>
              )}
            </div>
          )}

          {activeTab === 'wallet' && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold dark:text-white text-gray-900">
                  Wallet & Transactions
                </h2>
                <p className="text-gray-600 dark:text-white mt-1">
                  Manage your payments and view transaction history
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-card/90 dark:text-foreground rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-4">
                    Wallet Balance
                  </h3>
                  <div className="text-center p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                    <p className="text-4xl font-bold">${walletBalance}</p>
                    <p className="text-blue-100 mt-2">Available balance</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    <button
                      type="button"
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Funds
                    </button>
                    <button
                      type="button"
                      className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Withdraw Funds
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-card/90 dark:text-foreground rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold dark:text-white text-gray-900">
                      Payment Methods
                    </h3>
                    <button
                      type="button"
                      className="text-blue-600 dark:text-white hover:text-blue-700 text-sm font-medium"
                    >
                      + Add New
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">VISA</span>
                        </div>
                        <div>
                          <p className="font-medium dark:text-white text-gray-900">
                            •••• •••• •••• 4532
                          </p>
                          <p className="text-sm dark:text-white text-gray-500">Expires 12/26</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Primary
                      </span>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-8 bg-gray-800 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">BANK</span>
                        </div>
                        <div>
                          <p className="font-medium dark:text-white text-gray-900">
                            Chase Bank ••••9876
                          </p>
                          <p className="text-sm dark:text-white text-gray-500">Checking Account</p>
                        </div>
                      </div>
                      <button type="button" className="text-gray-400 hover:text-gray-600">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-white dark:bg-card/90 dark:text-foreground rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold dark:text-white text-gray-900">
                      Transaction History
                    </h3>
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-card/90 dark:text-foreground">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-card/90 dark:text-foreground divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="">
                          <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-white text-gray-900">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap dark:text-white text-sm text-gray-900">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap dark:text-white text-sm font-medium text-gray-900">
                            <span
                              className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}
                            >
                              {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                transaction.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' &&
            (profileError ? (
              <ErrorDisplay
                message={profileError}
                onRetry={handleRefresh}
                title="Failed to load profile"
              />
            ) : user ? (
              <ProfileManagement
                user={{
                  ...user,
                  totalSpent: user.totalSpent || 0,
                  totalBookings: user.totalBookings || 0,
                  preferences: {
                    notifications: user.preferences?.notifications ?? true,
                    emailUpdates: user.preferences?.emailNotifications ?? true,
                    pushNotifications: false,
                  },
                }}
                onUpdateProfile={handleUpdateProfile}
                onUploadAvatar={handleUploadAvatar}
                onDeleteAccount={async () => {
                  if (user) await apiDeleteAccount(user.id.toString());
                }}
                isLoading={isLoadingProfile}
              />
            ) : (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              </div>
            ))}

          {activeTab === 'analytics' && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold dark:text-white text-gray-900">
                  Travel Analytics
                </h2>
                <p className="text-gray-600 dark:text-white mt-1">
                  Insights about your travel patterns and preferences
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-card/90 dark:text-foreground shadow p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium dark:text-white text-gray-600">
                        Average Rating
                      </p>
                      <p className="text-3xl font-bold dark:text-white text-gray-900">
                        {stats.averageRating}
                      </p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-card/90 dark:text-foreground p-6 rounded-xl shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium dark:text-white text-gray-600">
                        Member Since
                      </p>
                      <p className="text-3xl font-bold text-blue-600">{stats.memberSince}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-card/90 dark:text-foreground p-6 rounded-xl shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium dark:text-white text-gray-600">
                        Total Spent
                      </p>
                      <p className="text-3xl font-bold text-green-600">${stats.totalSpent}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-card/90 dark:text-foreground rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-4">
                    Booking Trends
                  </h3>
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4" />
                      <p>Booking trends chart will be displayed here</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-card/90 dark:text-foreground rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-4">
                    Spending Analysis
                  </h3>
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <PieChart className="w-16 h-16 mx-auto mb-4" />
                      <p>Spending analysis chart will be displayed here</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
};

export default TenantDashboard;
