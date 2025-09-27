import { useCallback, useEffect, useState } from 'react';
import { bookingAPI, dashboardAPI, handleAPIError, profileAPI, walletAPI } from '../services/api';
import type { BookingFilters, DashboardBooking, Transaction, UserProfile } from '../types';
import { useApiWithRetry } from './useApiWithRetry';

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
  profile: UserProfile | null;
  transactions: Transaction[];
  stats: DashboardStats | null;

  isLoadingBookings: boolean;
  isLoadingProfile: boolean;
  isLoadingTransactions: boolean;
  isLoadingStats: boolean;

  error: string | null;
  errors: {
    bookings: string | null;
    profile: string | null;
    transactions: string | null;
    stats: string | null;
  };

  refreshBookings: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useDashboard = ({ userId, userType }: UseDashboardProps): UseDashboardReturn => {
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    bookings: null as string | null,
    profile: null as string | null,
    transactions: null as string | null,
    stats: null as string | null,
  });

  // Use retry-enabled API hook
  const getBookings = useCallback(
    (...args: unknown[]) =>
      bookingAPI.getBookings(args[0] as string, args[1] as BookingFilters | undefined),
    []
  );
  const getProfile = useCallback(
    (...args: unknown[]) => profileAPI.getUserProfile(args[0] as string),
    []
  );
  const getTransactions = useCallback(
    (...args: unknown[]) => walletAPI.getTransactionHistory(args[0] as string),
    []
  );
  const getStats = useCallback(
    (...args: unknown[]) =>
      dashboardAPI.getDashboardStats(args[0] as string, args[1] as 'host' | 'tenant'),
    []
  );

  const bookingsApi = useApiWithRetry(getBookings);
  const profileApi = useApiWithRetry(getProfile);
  const transactionsApi = useApiWithRetry(getTransactions);
  const statsApi = useApiWithRetry(getStats);

  const fetchBookings = useCallback(async () => {
    if (!userId) return;

    setIsLoadingBookings(true);
    setError(null);
    setErrors((prev) => ({ ...prev, bookings: null }));

    try {
      const result = await bookingsApi.execute(userId, { userType });
      if (result) {
        setBookings((result.data || []) as unknown as DashboardBooking[]);
      }
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      setErrors((prev) => ({ ...prev, bookings: errorMessage }));
      console.error('Failed to fetch bookings:', err);
    } finally {
      setIsLoadingBookings(false);
    }
  }, [userId, userType, bookingsApi]);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    setIsLoadingProfile(true);
    setError(null);
    setErrors((prev) => ({ ...prev, profile: null }));

    try {
      const result = await profileApi.execute(userId);
      if (result && typeof result === 'object' && result !== null && 'data' in result) {
        setProfile((result as { data: UserProfile }).data);
      }
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      setErrors((prev) => ({ ...prev, profile: errorMessage }));
      console.error('Failed to fetch profile:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [userId, profileApi]);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;

    setIsLoadingTransactions(true);
    setError(null);
    setErrors((prev) => ({ ...prev, transactions: null }));

    try {
      const result = await transactionsApi.execute(userId);
      if (result && typeof result === 'object' && result !== null && 'data' in result) {
        setTransactions((result as { data: Transaction[] }).data || []);
      }
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      setErrors((prev) => ({ ...prev, transactions: errorMessage }));
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [userId, transactionsApi]);

  const fetchStats = useCallback(async () => {
    if (!userId) return;

    setIsLoadingStats(true);
    setError(null);
    setErrors((prev) => ({ ...prev, stats: null }));

    try {
      const result = await statsApi.execute(userId, userType);
      if (result && typeof result === 'object' && result !== null && 'data' in result) {
        setStats((result as { data: DashboardStats }).data);
      }
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      setErrors((prev) => ({ ...prev, stats: errorMessage }));
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [userId, userType, statsApi]);

  const refreshBookings = useCallback(() => fetchBookings(), [fetchBookings]);
  const refreshProfile = useCallback(() => fetchProfile(), [fetchProfile]);
  const refreshTransactions = useCallback(() => fetchTransactions(), [fetchTransactions]);
  const refreshStats = useCallback(() => fetchStats(), [fetchStats]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchBookings(), fetchProfile(), fetchTransactions(), fetchStats()]);
  }, [fetchBookings, fetchProfile, fetchTransactions, fetchStats]);

  useEffect(() => {
    if (userId) {
      refreshAll();
    }
  }, [userId, refreshAll]);

  return {
    bookings,
    profile,
    transactions,
    stats,
    isLoadingBookings,
    isLoadingProfile,
    isLoadingTransactions,
    isLoadingStats,
    error,
    errors,
    refreshBookings,
    refreshProfile,
    refreshTransactions,
    refreshStats,
    refreshAll,
  };
};
