'use client';
import {
  AlertCircle,
  Bell,
  Check,
  ChevronDown,
  Home,
  Loader2,
  RefreshCw,
  Search,
  Settings,
  User,
  Wallet,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useDashboard } from '@/hooks/useDashboard';
import { transformFromLegacyUser, transformToLegacyBooking, transformToLegacyUser } from '@/types';
import type {
  LegacyBooking as BookingType,
  Transaction,
  LegacyUserProfile as UserProfile,
  Notification,
} from '@/types';
import BookingCard from './components/booking-card';
import { BookingModal, CancelModal } from './components/modal';
import ProfileManagement from './components/profile-management';
import WalletTransactions from './components/wallet-transaction';
import BookingHistory from '@/components/dashboard/BookingHistory';
import NotificationSystem from '@/components/dashboard/NotificationSystem';

const TenantDashboard: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile' | 'wallet'>('bookings');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<BookingType | null>(null);
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
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
    exportTransactions: apiExportTransactions,
    refetchAll,
    isAuthenticated,
  } = useDashboard();

  const bookings = apiBookings.map(transformToLegacyBooking);
  const user = apiUser ? transformToLegacyUser(apiUser) : null;
  const transactions = apiTransactions;

  const filterOptions = [
    { value: 'all', label: 'All Bookings' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

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

  const getCurrentFilterLabel = () => {
    const currentOption = filterOptions.find((option) => option.value === filterStatus);
    return currentOption ? currentOption.label : 'All Bookings';
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.propertyLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleViewDetails = (booking: BookingType): void => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const handleCancelBooking = (booking: BookingType): void => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (bookingId: number): Promise<void> => {
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

  const handleExportTransactions = (): void => {
    apiExportTransactions();
  };

  const handleRefresh = async (): Promise<void> => {
    await refetchAll();
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadNotifications(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    setUnreadNotifications(0);
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    setUnreadNotifications(prev => Math.max(0, prev - 1));
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

  const ErrorDisplay = ({
    error,
    onRetry,
    title = 'Something went wrong',
  }: {
    error: string;
    onRetry: () => void;
    title?: string;
  }) => (
    <div className="flex items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">{title}</h3>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  const LoadingDisplay = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
      <span className="text-gray-600 dark:text-gray-300">{message}</span>
    </div>
  );

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
            error={bookingsError}
          />
        )}

        {activeTab === 'profile' &&
          (profileError ? (
            <ErrorDisplay
              error={profileError}
              onRetry={handleRefresh}
              title="Failed to load profile"
            />
          ) : isLoadingProfile ? (
            <LoadingDisplay message="Loading your profile..." />
          ) : user ? (
            <ProfileManagement 
              user={user} 
              onUpdateProfile={handleUpdateUser}
              onUploadAvatar={async () => true} 
              onDeleteAccount={async () => {
                if (confirm('Are you sure you want to delete your account?')) {
                  return true;
                }
                return false;
              }}
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
              error={walletError}
              onRetry={handleRefresh}
              title="Failed to load wallet"
            />
          ) : isLoadingWallet ? (
            <LoadingDisplay message="Loading wallet information..." />
          ) : (
            <WalletTransactions
              walletBalance={walletBalance}
              pendingTransactions={pendingTransactions}
              transactions={transactions}
              onExportTransactions={handleExportTransactions}
            />
          ))}
      </div>

      <BookingModal
        booking={selectedBooking}
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onCancel={handleCancelBooking}
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
