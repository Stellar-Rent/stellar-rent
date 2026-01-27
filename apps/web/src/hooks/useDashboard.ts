import { useCallback, useEffect, useState } from 'react';
import { bookingAPI, dashboardAPI, handleAPIError, profileAPI, walletAPI } from '../services/api';
import type { DashboardBooking, Transaction, UserProfile } from '../types';
import { retryApiCall } from './useApiCall';

interface UseDashboardProps {
  userId: string;
  userType: 'host' | 'tenant';
}

interface DashboardStats {
  totalBookings: number;
  totalEarnings: number;
  averageRating: number;
  activeProperties?: number;
  pendingBookings?: number;
  completedBookings?: number;
}

interface UseDashboardReturn {
  bookings: DashboardBooking[];
  user: UserProfile | null;
  transactions: Transaction[];
  stats: DashboardStats | null;
  walletBalance: number;
  pendingTransactions: number;

  isLoadingBookings: boolean;
  isLoadingProfile: boolean;
  isLoadingTransactions: boolean;
  isLoadingStats: boolean;
  isLoadingWallet: boolean;

  bookingsError: string | null;
  profileError: string | null;
  walletError: string | null;
  error: string | null; // Generic error for overall state

  refreshBookings: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refetchAll: () => Promise<void>;
  cancelBooking: (id: string) => Promise<boolean>;
  updateProfile: (data: UserProfile) => Promise<boolean>;
  uploadAvatar: (userId: string, file: File) => Promise<boolean>;
  deleteAccount: (userId: string) => Promise<boolean>;
  exportTransactions: () => void;
  isAuthenticated: boolean;
}

export const useDashboard = (props?: UseDashboardProps): UseDashboardReturn => {
  const _userId = props?.userId || '1';
  const userType = props?.userType || 'tenant';

  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [walletBalance] = useState(2500.5);
  const [pendingTransactions] = useState(2);

  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingWallet, _setIsLoadingWallet] = useState(false);

  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoadingBookings(true);
    setBookingsError(null);
    try {
      const response = await retryApiCall(
        async () => {
          const res = await fetch('/api/bookings');
          if (!res.ok) throw new Error(`Failed to fetch bookings: ${res.statusText}`);
          return res;
        },
        3,
        1000
      );
      const data = await response.json();
      const bookingsData = data.data?.bookings || data.bookings || data || [];
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
      setBookingsError(message);
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    setProfileError(null);
    try {
      const response = await retryApiCall(
        async () => {
          const res = await fetch('/api/profile');
          if (!res.ok) throw new Error(`Failed to fetch profile: ${res.statusText}`);
          return res;
        },
        3,
        1000
      );
      const data = await response.json();
      setUser(data || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile';
      setProfileError(message);
      setUser(null);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setIsLoadingTransactions(true);
    setWalletError(null);
    try {
      // Mock data
      const mockTransactions: Transaction[] = [
        {
          id: 1,
          date: '2025-05-28',
          description: 'Luxury Apartment',
          amount: -1250,
          type: 'payment',
          status: 'completed',
        },
        {
          id: 2,
          date: '2025-05-26',
          description: 'Beach House',
          amount: -900,
          type: 'payment',
          status: 'pending',
        },
      ];
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTransactions(mockTransactions);
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      // Simplified mock stats
      setStats({
        totalBookings: 12,
        totalEarnings: 4500,
        averageRating: 4.8,
        activeProperties: userType === 'host' ? 3 : 0,
        pendingBookings: 2,
        completedBookings: 8,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [userType]);

  const cancelBooking = useCallback(async (id: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setBookings((prev) => prev.filter((b) => b.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
      return false;
    }
  }, []);

  const updateProfile = useCallback(async (data: UserProfile) => {
    try {
      setIsLoadingProfile(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUser(data);
      return true;
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const uploadAvatar = useCallback(async (_userId: string, _file: File) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return true;
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      return false;
    }
  }, []);

  const deleteAccount = useCallback(async (_userId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return true;
    } catch (err) {
      console.error('Failed to delete account:', err);
      return false;
    }
  }, []);

  const exportTransactions = useCallback(() => {
    console.log('Exporting transactions...');
  }, []);

  const refetchAll = useCallback(async () => {
    await Promise.all([fetchBookings(), fetchProfile(), fetchTransactions(), fetchStats()]);
  }, [fetchBookings, fetchProfile, fetchTransactions, fetchStats]);

  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  return {
    bookings,
    user,
    transactions,
    stats,
    walletBalance,
    pendingTransactions,
    isLoadingBookings,
    isLoadingProfile,
    isLoadingTransactions,
    isLoadingStats,
    isLoadingWallet,
    bookingsError,
    profileError,
    walletError,
    error,
    refreshBookings: fetchBookings,
    refreshProfile: fetchProfile,
    refreshTransactions: fetchTransactions,
    refreshStats: fetchStats,
    refetchAll,
    cancelBooking,
    updateProfile,
    uploadAvatar,
    deleteAccount,
    exportTransactions,
    isAuthenticated: true, // Mock auth state
  };
};
