'use client';
import {
  AlertCircle,
  Check,
  Home,
  Loader2,
  LogOut,
  RefreshCw,
  Settings,
  User,
  Wallet,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import BookingHistory from '@/components/dashboard/BookingHistory';
import NotificationSystem from '@/components/dashboard/NotificationSystem';
import { useAuth } from '@/hooks/auth/use-auth';
import { useDashboard } from '@/hooks/useDashboard';
import { profileAPI } from '@/services/api';
import { transformToLegacyBooking, transformToLegacyUser } from '@/types';
import type {
  LegacyBooking as BookingType,
  Notification,
  LegacyUserProfile as UserProfile,
} from '@/types';
import { BookingModal, CancelModal } from './components/modal';
import ProfileManagement from './components/profile-management';
import WalletTransactions from './components/wallet-transaction';

const TenantDashboard: React.FC = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile' | 'wallet'>('bookings');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<BookingType | null>(null);
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  const {
    bookings: apiBookings = [],
    user: apiUser = null,
    transactions: apiTransactions = [],
    walletBalance = 0,
    pendingTransactions = [],
    isLoadingBookings = false,
    isLoadingProfile = false,
    isLoadingWallet = false,
    bookingsError = null,
    cancelBooking: apiCancelBooking,
    updateProfile: apiUpdateProfile,
    exportTransactions: apiExportTransactions,
    refetchAll,
    isAuthenticated,
  } = useDashboard({ userId: 'current', userType: 'tenant' }) as any;

  const bookings = (apiBookings || []).map(transformToLegacyBooking);
  const user = apiUser ? transformToLegacyUser(apiUser) : null;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Lógica para cerrar dropdown si existiera
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirmCancel = async (bookingId: number | string): Promise<void> => {
    try {
      const success = await apiCancelBooking(bookingId.toString());
      if (success) showToast('Booking cancelled successfully', 'success');
      else showToast('Failed to cancel booking', 'error');
    } catch (_error) {
      showToast('An error occurred while cancelling the booking', 'error');
    } finally {
      setShowCancelModal(false);
      setSelectedBooking(null);
    }
  };

  const handleUpdateUser = async (updatedUser: UserProfile): Promise<void> => {
    try {
      const success = await apiUpdateProfile(updatedUser as any);
      if (success) showToast('Profile updated successfully', 'success');
      else showToast('Failed to update profile', 'error');
    } catch (_error) {
      showToast('An error occurred while updating profile', 'error');
    }
  };

  const handleUploadAvatar = async (file: File): Promise<boolean> => {
    try {
      if (!user?.id) return false;
      const response = await profileAPI.uploadAvatar(user.id.toString(), file);
      if (response && !('error' in (response as any))) {
        showToast('Avatar uploaded successfully', 'success');
        await refetchAll();
        return true;
      }
      return false;
    } catch (_error) {
      return false;
    }
  };

  const handleDeleteAccount = async (): Promise<boolean> => {
    try {
      if (!user?.id) return false;
      if (!confirm('Are you sure you want to delete your account?')) return false;
      const response = await profileAPI.deleteAccount(user.id.toString());
      if (response && !('error' in (response as any))) {
        showToast('Account deleted successfully', 'success');
        router.push('/');
        return true;
      }
      return false;
    } catch (_error) {
      return false;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1D39]">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg mt-4"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-[2em] lg:mt-0 bg-gray-50 pt-[5%] bg-gradient-to-b from-white to-blue-50 dark:from-[#0B1D39] dark:to-[#071429] dark:text-white">
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div
            className={`rounded-lg p-4 shadow-lg border ${toast.type === 'success' ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-100 border-red-200 text-red-800'}`}
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
      )}

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
                onClick={() => refetchAll()}
                className="text-gray-500 dark:text-white hover:text-gray-700"
              >
                <RefreshCw className={`w-6 h-6 ${isLoadingBookings ? 'animate-spin' : ''}`} />
              </button>
              <NotificationSystem
                notifications={notifications}
                unreadCount={unreadNotifications}
                onMarkAsRead={(id) =>
                  setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, read: true } : n))
                  )
                }
                onMarkAllAsRead={() => {
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                  setUnreadNotifications(0);
                }}
                onDeleteNotification={(id) =>
                  setNotifications((prev) => prev.filter((n) => n.id !== id))
                }
                onDeleteAllNotifications={() => {
                  setNotifications([]);
                  setUnreadNotifications(0);
                }}
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
                  <span className="text-sm font-medium text-gray-700 dark:text-white hidden sm:inline">
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
                className="flex items-center space-x-1 text-gray-500 dark:text-white hover:text-red-500"
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
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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
            bookings={bookings as any}
            isLoading={isLoadingBookings}
            onViewDetails={
              ((b: any) => {
                setSelectedBooking(b);
                setShowBookingModal(true);
              }) as any
            }
            onCancelBooking={async (id: string) => {
              const book = bookings.find((b: any) => b.id.toString() === id);
              if (book) {
                setSelectedBooking(book);
                setShowCancelModal(true);
              }
            }}
            error={bookingsError}
          />
        )}

        {activeTab === 'profile' && user && (
          <ProfileManagement
            {...({
              user: user,
              onUpdateProfile: handleUpdateUser,
              onUploadAvatar: handleUploadAvatar,
              onDeleteAccount: handleDeleteAccount,
            } as any)}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletTransactions
            walletBalance={walletBalance}
            pendingTransactions={pendingTransactions}
            transactions={apiTransactions}
            onExportTransactions={apiExportTransactions}
          />
        )}
      </div>

      <BookingModal
        booking={selectedBooking}
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onCancel={() => setShowCancelModal(true)}
      />
      <CancelModal
        booking={selectedBooking}
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={(id: any) => handleConfirmCancel(id)}
      />
    </div>
  );
};

export default TenantDashboard;
