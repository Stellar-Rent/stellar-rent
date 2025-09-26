// src/hooks/useDashboard.ts
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { bookingAPI, dashboardAPI, handleAPIError, profileAPI, walletAPI } from '../services/api';
import type { DashboardBooking, Transaction, UserProfile, DashboardStats } from '../types';

interface UseDashboardProps {
  userId: string;
  userType: 'host' | 'tenant';
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

/* ... DashboardStats, UseDashboardReturn definitions same as yours ... */

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

    try {
      const response = await bookingAPI.getBookings(userId, { userId, userType });
      // Map Booking[] to DashboardBooking[] by adding missing properties
      const bookingsData: DashboardBooking[] = (response.data || []).map((booking: any) => ({
        ...booking,
        propertyLocation: booking.propertyLocation ?? booking.property?.location ?? '',
        hostName: booking.hostName ?? booking.host?.name ?? '',
      }));
      setBookings(bookingsData);
    } catch (err) {
      const msg = handleAPIError(err);
      setError(prev => (prev ? `${prev}; ${msg}` : msg));
      console.error('Failed to fetch bookings:', err);
      // If endpoint doesn't exist (404) we fall back to empty bookings and continue:
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setBookings([]);
        return;
      }
      // other errors rethrow so refreshAll can see the failure
      throw err;
    } finally {
      setIsLoadingBookings(false);
    }
  }, [userId, userType]);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setIsLoadingProfile(true);

    try {
      const response = await profileAPI.getUserProfile(userId);
      setProfile((response as { data: UserProfile | null }).data ?? null);
    } catch (err) {
      const msg = handleAPIError(err);
      setError(prev => (prev ? `${prev}; ${msg}` : msg));
      console.error('Failed to fetch profile:', err);
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setProfile(null);
        return;
      }
      throw err;
    } finally {
      setIsLoadingProfile(false);
    }
  }, [userId]);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;
    setIsLoadingTransactions(true);

    try {
      const response = await walletAPI.getTransactionHistory(userId);
      setTransactions((response as { data: Transaction[] }).data || []);
    } catch (err) {
      const msg = handleAPIError(err);
      setError(prev => (prev ? `${prev}; ${msg}` : msg));
      console.error('Failed to fetch transactions:', err);
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setTransactions([]);
        return;
      }
      throw err;
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [userId]);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    setIsLoadingStats(true);

    try {
      const response = await dashboardAPI.getDashboardStats(userId, userType);
      setStats((response as { data: DashboardStats | null }).data ?? null);
    } catch (err) {
      const msg = handleAPIError(err);
      setError(prev => (prev ? `${prev}; ${msg}` : msg));
      console.error('Failed to fetch dashboard stats:', err);
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setStats(null);
        return;
      }
      throw err;
    } finally {
      setIsLoadingStats(false);
    }
  }, [userId, userType]);

  const refreshBookings = useCallback(() => fetchBookings(), [fetchBookings]);
  const refreshProfile = useCallback(() => fetchProfile(), [fetchProfile]);
  const refreshTransactions = useCallback(() => fetchTransactions(), [fetchTransactions]);
  const refreshStats = useCallback(() => fetchStats(), [fetchStats]);

  const refreshAll = useCallback(async () => {
    // run all and gather results so partial successes don't block the UI
    const results = await Promise.allSettled([fetchBookings(), fetchProfile(), fetchTransactions(), fetchStats()]);
    const rejections = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];

    if (rejections.length > 0) {
      // convert each reason via handleAPIError if possible
      const msgs = rejections.map(r => handleAPIError(r.reason));
      setError(prev => (prev ? `${prev}; ${msgs.join('; ')}` : msgs.join('; ')));
    }
  }, [fetchBookings, fetchProfile, fetchTransactions, fetchStats]);

  useEffect(() => {
    if (userId) {
      refreshAll().catch(e => {
        // already handled inside; defensive logging
        console.error('refreshAll encountered error', e);
      });
    }
  }, [userId, userType, refreshAll]);

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











// import { useCallback, useEffect, useState } from 'react';
// import { bookingAPI, dashboardAPI, handleAPIError, profileAPI, walletAPI } from '../services/api';
// import type { DashboardBooking, Transaction, UserProfile } from '../types';

// interface UseDashboardProps {
//   userId: string;
//   userType: 'host' | 'tenant';
// }

// interface DashboardStats {
//   totalBookings: number;
//   totalEarnings: number;
//   averageRating: number;
//   activeProperties?: number;
//   pendingBookings?: number;
//   completedBookings?: number;
// }

// interface UseDashboardReturn {
//   bookings: DashboardBooking[];
//   profile: UserProfile | null;
//   transactions: Transaction[];
//   stats: DashboardStats | null;

//   isLoadingBookings: boolean;
//   isLoadingProfile: boolean;
//   isLoadingTransactions: boolean;
//   isLoadingStats: boolean;

//   error: string | null;

//   refreshBookings: () => Promise<void>;
//   refreshProfile: () => Promise<void>;
//   refreshTransactions: () => Promise<void>;
//   refreshStats: () => Promise<void>;
//   refreshAll: () => Promise<void>;
// }

// export const useDashboard = ({ userId, userType }: UseDashboardProps): UseDashboardReturn => {
//   const [bookings, setBookings] = useState<DashboardBooking[]>([]);
//   const [profile, setProfile] = useState<UserProfile | null>(null);
//   const [transactions, setTransactions] = useState<Transaction[]>([]);
//   const [stats, setStats] = useState<DashboardStats | null>(null);

//   const [isLoadingBookings, setIsLoadingBookings] = useState(false);
//   const [isLoadingProfile, setIsLoadingProfile] = useState(false);
//   const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
//   const [isLoadingStats, setIsLoadingStats] = useState(false);

//   const [error, setError] = useState<string | null>(null);

//   const fetchBookings = useCallback(async () => {
//     if (!userId) return;

//     setIsLoadingBookings(true);
//     setError(null);

//     try {
//       const response = await bookingAPI.getBookings(userId, { userType });
//       setBookings(response.data || []);
//     } catch (err) {
//       const errorMessage = handleAPIError(err);
//       setError(errorMessage);
//       console.error('Failed to fetch bookings:', err);
//     } finally {
//       setIsLoadingBookings(false);
//     }
//   }, [userId, userType]);

//   const fetchProfile = useCallback(async () => {
//     if (!userId) return;

//     setIsLoadingProfile(true);
//     setError(null);

//     try {
//       const response = await profileAPI.getUserProfile(userId);
//       setProfile(response.data);
//     } catch (err) {
//       const errorMessage = handleAPIError(err);
//       setError(errorMessage);
//       console.error('Failed to fetch profile:', err);
//     } finally {
//       setIsLoadingProfile(false);
//     }
//   }, [userId]);

//   const fetchTransactions = useCallback(async () => {
//     if (!userId) return;

//     setIsLoadingTransactions(true);
//     setError(null);

//     try {
//       const response = await walletAPI.getTransactionHistory(userId);
//       setTransactions(response.data || []);
//     } catch (err) {
//       const errorMessage = handleAPIError(err);
//       setError(errorMessage);
//       console.error('Failed to fetch transactions:', err);
//     } finally {
//       setIsLoadingTransactions(false);
//     }
//   }, [userId]);

//   const fetchStats = useCallback(async () => {
//     if (!userId) return;

//     setIsLoadingStats(true);
//     setError(null);

//     try {
//       const response = await dashboardAPI.getDashboardStats(userId, userType);
//       setStats(response.data);
//     } catch (err) {
//       const errorMessage = handleAPIError(err);
//       setError(errorMessage);
//       console.error('Failed to fetch dashboard stats:', err);
//     } finally {
//       setIsLoadingStats(false);
//     }
//   }, [userId, userType]);

//   const refreshBookings = useCallback(() => fetchBookings(), [fetchBookings]);
//   const refreshProfile = useCallback(() => fetchProfile(), [fetchProfile]);
//   const refreshTransactions = useCallback(() => fetchTransactions(), [fetchTransactions]);
//   const refreshStats = useCallback(() => fetchStats(), [fetchStats]);

//   const refreshAll = useCallback(async () => {
//     await Promise.all([fetchBookings(), fetchProfile(), fetchTransactions(), fetchStats()]);
//   }, [fetchBookings, fetchProfile, fetchTransactions, fetchStats]);

//   useEffect(() => {
//     if (userId) {
//       refreshAll();
//     }
//   }, [userId, userType, refreshAll]);

//   return {
//     bookings,
//     profile,
//     transactions,
//     stats,
//     isLoadingBookings,
//     isLoadingProfile,
//     isLoadingTransactions,
//     isLoadingStats,
//     error,
//     refreshBookings,
//     refreshProfile,
//     refreshTransactions,
//     refreshStats,
//     refreshAll,
//   };
// };
