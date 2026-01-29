import { useCallback, useEffect, useState } from 'react';
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
      const response = await fetch('/api/bookings');
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.statusText}`);
      }
      const data = await response.json();
      // Handle the response structure from backend
      const bookingsData = data.data?.bookings || data.bookings || data || [];
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bookings';
      setError(errorMessage);
      console.error('Failed to fetch bookings:', err);
      setBookings([]); // Reset to empty array on error
    } finally {
      setIsLoadingBookings(false);
    }
  }, [userId]);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    setIsLoadingProfile(true);
    setError(null);

    try {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }
      const data = await response.json();
      setProfile(data || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      console.error('Failed to fetch profile:', err);
      setProfile(null); // Reset to null on error
    } finally {
      setIsLoadingProfile(false);
    }
  }, [userId]);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;

    setIsLoadingTransactions(true);
    setError(null);

    try {
      // Use mock data until wallet transactions endpoint is implemented
      // TODO: Replace with real API call when /api/wallet/transactions is available
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          date: '2025-05-28',
          description: 'Luxury Downtown Apartment',
          amount: -1250,
          type: 'booking',
          status: 'completed',
        },
        {
          id: '2',
          date: '2025-05-26',
          description: 'Cozy Beach House',
          amount: -900,
          type: 'booking',
          status: 'pending',
        },
        {
          id: '3',
          date: '2025-05-20',
          description: 'Wallet Top-up',
          amount: 2000,
          type: 'deposit',
          status: 'completed',
        },
        {
          id: '4',
          date: '2025-05-15',
          description: 'Mountain Cabin Retreat',
          amount: -1600,
          type: 'booking',
          status: 'completed',
        },
      ];

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTransactions(mockTransactions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(errorMessage);
      console.error('Failed to fetch transactions:', err);
      setTransactions([]); // Reset to empty array on error
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [userId]);

  const fetchStats = useCallback(async () => {
    if (!userId) return;

    setIsLoadingStats(true);
    setError(null);

    try {
      // Calculate stats from bookings data instead of calling non-existent analytics endpoint
      // TODO: Replace with real analytics API when /api/analytics/overview is implemented
      const response = await fetch('/api/bookings');
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings for stats: ${response.statusText}`);
      }
      const data = await response.json();
      const bookingsData = data.data?.bookings || data.bookings || [];

      // Calculate stats from bookings
      const totalBookings = bookingsData.length;
      const totalEarnings = bookingsData.reduce(
        (sum: number, booking: { total: string | number }) => {
          return sum + (Number.parseFloat(String(booking.total)) || 0);
        },
        0
      );
      const pendingBookings = bookingsData.filter(
        (booking: { status: string }) => booking.status === 'pending'
      ).length;
      const completedBookings = bookingsData.filter(
        (booking: { status: string }) => booking.status === 'completed'
      ).length;

      const calculatedStats: DashboardStats = {
        totalBookings,
        totalEarnings,
        averageRating: 4.8, // Mock rating until reviews are implemented
        activeProperties: userType === 'host' ? totalBookings : 0, // Mock for now
        pendingBookings,
        completedBookings,
      };

      setStats(calculatedStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard stats';
      setError(errorMessage);
      console.error('Failed to fetch dashboard stats:', err);
      // Set default stats on error
      setStats({
        totalBookings: 0,
        totalEarnings: 0,
        averageRating: 0,
        activeProperties: 0,
        pendingBookings: 0,
        completedBookings: 0,
      });
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
