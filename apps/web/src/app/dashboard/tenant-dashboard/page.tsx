'use client';

import BookingHistory from '@/components/dashboard/BookingHistory';
import NotificationSystem from '@/components/dashboard/NotificationSystem';
import ProfileManagement from '@/components/dashboard/ProfileManagement';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import RoleGuard from '@/hooks/auth/RoleGuard';
import {
  BarChart3,
  Calendar,
  Check,
  CheckCircle,
  DollarSign,
  Download,
  Edit3,
  LogOut,
  PieChart,
  Settings,
  Star,
  User,
  Wallet,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '~/hooks/auth/use-auth';

interface Booking {
  id: string;
  propertyTitle: string;
  propertyImage: string;
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  bookingDate: string;
  propertyId: string;
  escrowAddress?: string;
  transactionHash?: string;
  canCancel: boolean;
  canReview: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  location?: string;
  bio?: string;
  memberSince: string;
  totalBookings: number;
  totalSpent: number;
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    pushNotifications: boolean;
  };
}

// Mock data for demonstration
const mockBookings: Booking[] = [
  {
    id: '1',
    propertyTitle: 'Luxury Downtown Apartment',
    propertyImage:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
    location: 'New York, NY',
    checkIn: '2025-06-15',
    checkOut: '2025-06-20',
    guests: 2,
    totalAmount: 1250,
    status: 'confirmed',
    bookingDate: '2025-05-28',
    propertyId: '1',
    escrowAddress: 'GCO2IP3MJNUOKS4PUDI4C7LGGMQDJGXG3COYX3WSB4HHNAHKYV5YL3VC',
    canCancel: true,
    canReview: false,
  },
  {
    id: '2',
    propertyTitle: 'Cozy Beach House',
    propertyImage:
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop',
    location: 'Miami, FL',
    checkIn: '2025-07-10',
    checkOut: '2025-07-15',
    guests: 4,
    totalAmount: 900,
    status: 'pending',
    bookingDate: '2025-05-26',
    propertyId: '2',
    canCancel: true,
    canReview: false,
  },
  {
    id: '3',
    propertyTitle: 'Mountain Cabin Retreat',
    propertyImage:
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format&fit=crop',
    location: 'Aspen, CO',
    checkIn: '2025-05-20',
    checkOut: '2025-05-25',
    guests: 3,
    totalAmount: 1600,
    status: 'completed',
    bookingDate: '2025-04-15',
    propertyId: '3',
    canCancel: false,
    canReview: true,
  },
];

const mockUser: UserProfile = {
  id: '1',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@example.com',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  bio: 'Travel enthusiast and adventure seeker. Love exploring new places and meeting interesting people.',
  memberSince: '2023',
  totalBookings: 12,
  totalSpent: 8500,
  preferences: {
    notifications: true,
    emailUpdates: true,
    pushNotifications: false,
  },
};

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
  const router = useRouter();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState(mockBookings);
  const [user, setUser] = useState(mockUser);
  const [transactions, _setTransactions] = useState(mockTransactions);
  type NotificationItem = {
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [walletBalance, _setWalletBalance] = useState(2500);
  const [isLoading, setIsLoading] = useState(false);

  const stats = {
    totalBookings: bookings.length,
    upcomingBookings: bookings.filter(
      (b) => b.status === 'confirmed' && new Date(b.checkIn) > new Date()
    ).length,
    completedBookings: bookings.filter((b) => b.status === 'completed').length,
    totalSpent: user.totalSpent,
    averageRating: 4.8,
    memberSince: user.memberSince,
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

  const handleCancelBooking = async (bookingId: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: 'cancelled' as const, canCancel: false }
            : booking
        )
      );

      const newNotification = {
        id: Date.now().toString(),
        type: 'booking',
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (updatedProfile: Partial<UserProfile>) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setUser((prev) => ({ ...prev, ...updatedProfile }));

      const newNotification = {
        id: Date.now().toString(),
        type: 'system',
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadAvatar = async (file: File) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const avatarUrl = URL.createObjectURL(file);
      setUser((prev) => ({ ...prev, avatar: avatarUrl }));

      const newNotification = {
        id: Date.now().toString(),
        type: 'system',
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleGuard requiredRole="guest">
      <div className="min-h-screen bg-gray-50 bg-gradient-to-b from-white to-blue-50 dark:from-[#0B1D39] dark:to-[#071429] dark:text-white">
        <header className="bg-white dark:bg-card/90 dark:text-foreground shadow-sm border-b">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <Breadcrumb className="pt-4" />
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Tenant Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-4">
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
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                  className="flex items-center space-x-1 text-gray-500 dark:text-white hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm hidden sm:inline">Logout</span>
                </button>
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
                      <p className="text-sm font-medium dark:text-white text-gray-600">Upcoming</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.upcomingBookings}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-card/90 dark:text-foreground p-6 rounded-xl shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium dark:text-white text-gray-600">Completed</p>
                      <p className="text-3xl font-bold text-green-600">{stats.completedBookings}</p>
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
                isLoading={isLoading}
              />
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

          {activeTab === 'profile' && (
            <ProfileManagement
              user={user}
              onUpdateProfile={handleUpdateProfile}
              onUploadAvatar={handleUploadAvatar}
              isLoading={isLoading}
            />
          )}

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
