'use client';
import {
  AlertCircle,
  Bell,
  Check,
  ChevronDown,
  Home,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  Settings,
  User,
  Wallet,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import BookingHistory from '@/components/dashboard/BookingHistory';
import NotificationSystem from '@/components/dashboard/NotificationSystem';
import ProfileManagement from '@/components/dashboard/ProfileManagement';
import { useAuth } from '@/hooks/auth/use-auth';
import { useDashboard } from '@/hooks/useDashboard';
import { profileAPI } from '@/services/api';
import { transformFromLegacyUser, transformToLegacyBooking, transformToLegacyUser } from '@/types';
import type {
  LegacyBooking as BookingType,
  DashboardBooking,
  Notification,
  LegacyUserProfile as UserProfile,
  Transaction,
} from '@/types';
import type { Booking } from '@/types/shared';
import { BookingModal, CancelModal } from './components/modal';
import WalletTransactions from './components/wallet-transaction';

import { ErrorDisplay } from '@/components/ui/error-display';
import { LoadingGrid } from '@/components/ui/loading-skeleton';

const TenantDashboard: React.FC = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile' | 'wallet'>('bookings');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [_searchTerm, _setSearchTerm] = useState<string>('');
  const [_filterStatus, _setFilterStatus] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<BookingType | null>(null);
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [_isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  const {
    bookings: apiBookings,
    user: apiUser,
    transactions: apiTransactions,
    walletBalance,
    pendingTransactions,
    isLoadingBookings,
    isLoadingProfile,
    isLoadingWallet,
    bookingsError,
    profileError,
    walletError,
    cancelBooking: apiCancelBooking,
    updateProfile: apiUpdateProfile,
    uploadAvatar: apiUploadAvatar,
    deleteAccount: apiDeleteAccount,
    exportTransactions: apiExportTransactions,
    refetchAll,
    isAuthenticated,
  } = useDashboard();

  // Transform apiBookings to the format expected by BookingHistory
  const bookings: Booking[] = apiBookings.map((b) => ({
    id: b.id,
    propertyTitle: b.propertyTitle,
    propertyImage: b.propertyImage,
    location: b.propertyLocation,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    guests: b.guests,
    totalAmount: b.totalAmount,
    status: b.status as Booking['status'],
    bookingDate: b.bookingDate,
    propertyId: '1', // Placeholder
    canCancel: true,
    canReview: b.status === 'completed',
  }));

  const user = apiUser ? transformToLegacyUser(apiUser) : null;
  const transactions = apiTransactions;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewDetails = (booking: Booking): void => {
    // Legacy mapping or handle directly
    const found = apiBookings.find((b) => b.id === booking.id);
    if (found) {
      setSelectedBooking(transformToLegacyBooking(found));
    }
    setShowBookingModal(true);
  };

  const handleCancelBooking = (booking: Booking): void => {
    const found = apiBookings.find((b) => b.id === booking.id);
    if (found) {
      setSelectedBooking(transformToLegacyBooking(found));
    }
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (bookingId: number | string): Promise<void> => {
    try {
      const success = await apiCancelBooking(bookingId.toString());
      if (success) {
        showToast('Booking cancelled successfully', 'success');
      } else {
        showToast('Failed to cancel booking', 'error');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showToast('An error occurred while cancelling the booking', 'error');
    } finally {
      setShowCancelModal(false);
      setSelectedBooking(null);
    }
  };

  const handleUpdateUser = async (updatedUser: UserProfile): Promise<void> => {
    try {
      const apiUser = transformFromLegacyUser(updatedUser);
      const success = await apiUpdateProfile(apiUser);
      if (success) {
        showToast('Profile updated successfully', 'success');
      } else {
        showToast('Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('An error occurred while updating profile', 'error');
    }
  };

  const handleRefresh = async (): Promise<void> => {
    await refetchAll();
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
    setNotifications((prev) => {
      const notificationToDelete = prev.find((notification) => notification.id === id);
      const isUnread = notificationToDelete?.read === false;
      if (isUnread) {
        setUnreadNotifications((prevCount) => Math.max(0, prevCount - 1));
      }
      return prev.filter((notification) => notification.id !== id);
    });
  };

  const handleDeleteAllNotifications = () => {
    setNotifications([]);
    setUnreadNotifications(0);
  };

  // Toast Component
  const ToastNotification = () => {
    if (!toast.show) return null;

    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <div
          className={`rounded-lg p-4 shadow-lg ${
            toast.type === 'success'
              ? 'bg-green-100 border border-green-200 text-green-800'
              : 'bg-red-100 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center">
            {toast.type === 'success' ? (
              <Check className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1D39]">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please log in to access your dashboard
          </p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-[2em] lg:mt-0 bg-gray-50 pt-[5%] bg-gradient-to-b from-white to-blue-50 dark:from-[#0B1D39] dark:to-[#071429] dark:text-white">
      <ToastNotification />

      <header className="bg-white dark:bg-[#0B1D39]/90 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
              {(isLoadingBookings || isLoadingProfile || isLoadingWallet) && (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500 ml-3" />
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleRefresh}
                className="text-gray-500 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                disabled={isLoadingBookings || isLoadingProfile || isLoadingWallet}
              >
                <RefreshCw
                  className={`w-6 h-6 ${isLoadingBookings || isLoadingProfile || isLoadingWallet ? 'animate-spin' : ''}`}
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
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-white">
                    {user.name}
                  </span>
                </div>
              )}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'bookings' as const, label: 'My Bookings', icon: Home },
              { id: 'profile' as const, label: 'Profile', icon: User },
              { id: 'wallet' as const, label: 'Wallet', icon: Wallet },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'bookings' && (
          <BookingHistory
            bookings={bookings}
            isLoading={isLoadingBookings}
            onViewDetails={handleViewDetails}
            onRefresh={handleRefresh}
            onCancelBooking={async (id) => {
              await apiCancelBooking(id);
            }}
            error={bookingsError}
          />
        )}

        {activeTab === 'profile' &&
          (profileError ? (
            <ErrorDisplay
              message={profileError}
              onRetry={handleRefresh}
              title="Failed to load profile"
            />
          ) : isLoadingProfile ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            </div>
          ) : user ? (
            <ProfileManagement
              // biome-ignore lint/suspicious/noExplicitAny: mapping legacy
              user={user as unknown as any}
              // biome-ignore lint/suspicious/noExplicitAny: mapping legacy
              onUpdateProfile={handleUpdateUser as unknown as any}
              onUploadAvatar={async (file) => {
                await apiUploadAvatar(user.id.toString(), file);
              }}
              onDeleteAccount={async () => {
                await apiDeleteAccount(user.id.toString());
              }}
              isLoading={isLoadingProfile}
            />
          ) : (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                Profile not found
              </h3>
              <p className="text-gray-600 dark:text-white">
                Unable to load your profile information
              </p>
            </div>
          ))}

        {activeTab === 'wallet' &&
          (walletError ? (
            <ErrorDisplay
              message={walletError}
              onRetry={handleRefresh}
              title="Failed to load wallet"
            />
          ) : isLoadingWallet ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            </div>
          ) : (
            <WalletTransactions
              walletBalance={walletBalance}
              pendingTransactions={pendingTransactions}
              transactions={transactions as unknown as Transaction[]}
              onExportTransactions={apiExportTransactions}
            />
          ))}
      </div>

      <BookingModal
        booking={selectedBooking}
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onCancel={handleCancelBooking as unknown as (booking: BookingType) => void}
      />
      <CancelModal
        booking={selectedBooking}
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
};

export default TenantDashboard;