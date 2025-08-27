import { useCallback, useEffect, useState } from 'react';
import { bookingAPI, dashboardAPI, handleAPIError, profileAPI, walletAPI } from '../services/api';
import type { DashboardBooking, Transaction, UserProfile } from '../types';

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

  const fetchBookings = useCallback(async () => {
    if (!userId) return;

    setIsLoadingBookings(true);
    setError(null);

    try {
      const response = await bookingAPI.getBookings(userId, { userType });
      setBookings(response.data || []);
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      console.error('Failed to fetch bookings:', err);
    } finally {
      setIsLoadingBookings(false);
    }
  }, [userId, userType]);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    setIsLoadingProfile(true);
    setError(null);

    try {
      const response = await profileAPI.getUserProfile(userId);
      setProfile(response.data);
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      console.error('Failed to fetch profile:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [userId]);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;

    setIsLoadingTransactions(true);
    setError(null);

    try {
      const response = await walletAPI.getTransactionHistory(userId);
      setTransactions(response.data || []);
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [userId]);

  const fetchStats = useCallback(async () => {
    if (!userId) return;

    setIsLoadingStats(true);
    setError(null);

    try {
      const response = await dashboardAPI.getDashboardStats(userId, userType);
      setStats(response.data);
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [userId, userType]);

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
    refreshBookings,
    refreshProfile,
    refreshTransactions,
    refreshStats,
    refreshAll,
  };
};
