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

export const useDashboard = ({ userId, userType }: UseDashboardProps): any => {
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
      if (!response.ok) throw new Error(`Failed to fetch bookings: ${response.statusText}`);
      const data = await response.json();
      const bookingsData = data.data?.bookings || data.bookings || data || [];
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      setBookings([]);
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
      if (!response.ok) throw new Error(`Failed to fetch profile: ${response.statusText}`);
      const data = await response.json();
      setProfile(data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      setProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [userId]);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;
    setIsLoadingTransactions(true);
    setError(null);
    try {
      const mockTransactions: Transaction[] = [
        {
          id: 1,
          date: '2025-05-28',
          description: 'Luxury Downtown Apartment',
          amount: -1250,
          type: 'payment',
          status: 'completed',
        },
        {
          id: 2,
          date: '2025-05-26',
          description: 'Cozy Beach House',
          amount: -900,
          type: 'payment',
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
          type: 'payment',
          status: 'completed',
        },
      ];
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTransactions(mockTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [userId]);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    setIsLoadingStats(true);
    setError(null);
    try {
      const response = await fetch('/api/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings for stats');
      const data = await response.json();
      const bookingsData = data.data?.bookings || data.bookings || [];
      const totalBookings = bookingsData.length;
      const totalEarnings = bookingsData.reduce(
        (sum: number, b: any) => sum + (Number.parseFloat(String(b.total)) || 0),
        0
      );
      setStats({
        totalBookings,
        totalEarnings,
        averageRating: 4.8,
        activeProperties: userType === 'host' ? totalBookings : 0,
        pendingBookings: bookingsData.filter((b: any) => b.status === 'pending').length,
        completedBookings: bookingsData.filter((b: any) => b.status === 'completed').length,
      });
    } catch (_err) {
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

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchBookings(), fetchProfile(), fetchTransactions(), fetchStats()]);
  }, [fetchBookings, fetchProfile, fetchTransactions, fetchStats]);

  useEffect(() => {
    if (userId) refreshAll();
  }, [userId, refreshAll]);

  return {
    bookings,
    user: profile,
    transactions,
    stats,
    isLoadingBookings,
    isLoadingProfile,
    isLoadingTransactions,
    isLoadingStats,
    error,
    cancelBooking: async (id: any) => {
      console.log('Action: Cancel', id);
    },
    updateProfile: async (data: any) => {
      console.log('Action: Update', data);
    },
    exportTransactions: () => {
      console.log('Action: Export');
    },
    refetchAll: refreshAll,
    isAuthenticated: !!userId,
    walletBalance: 0,
    pendingTransactions: [],
  };
};
