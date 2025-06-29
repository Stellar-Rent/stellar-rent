import { useCallback, useEffect, useState } from 'react';
import { apiUtils, bookingAPI, profileAPI, walletAPI } from '../services/api';
import type { DashboardBooking, Transaction, UserProfile } from '../types';

export const useDashboard = () => {
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [pendingTransactions, setPendingTransactions] = useState<number>(0);

  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState<boolean>(false);

  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const fetchBookings = useCallback(async () => {
    setIsLoadingBookings(true);
    setBookingsError(null);
    try {
      const data = await bookingAPI.getBookings();
      setBookings(data);
    } catch (error) {
      const errorMessage = apiUtils.handleError(error as Error);
      setBookingsError(errorMessage);
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoadingBookings(false);
    }
  }, []);

  const cancelBooking = async (bookingId: string): Promise<boolean> => {
    try {
      const result = await bookingAPI.cancelBooking(bookingId);
      if (result.success) {
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: 'cancelled' as const, canCancel: false }
              : booking
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      return false;
    }
  };

  const confirmPayment = async (bookingId: string, transactionHash: string): Promise<boolean> => {
    try {
      const result = await bookingAPI.confirmPayment(bookingId, transactionHash);
      if (result.bookingId) {
        // Update local state
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: 'confirmed' as const, transaction_hash: transactionHash }
              : booking
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      return false;
    }
  };

  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    setProfileError(null);
    try {
      const userData = await profileAPI.getProfile();
      setUser(userData);
    } catch (error) {
      const errorMessage = apiUtils.handleError(error as Error);
      setProfileError(errorMessage);
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const updateProfile = async (updatedUser: UserProfile): Promise<boolean> => {
    try {
      const result = await profileAPI.updateProfile(updatedUser);
      setUser(result);
      return true;
    } catch (error) {
      console.error('Failed to update profile:', error);
      return false;
    }
  };

  const uploadAvatar = async (file: File): Promise<boolean> => {
    try {
      const result = await profileAPI.uploadAvatar(file);
      if (user) {
        setUser({ ...user, avatar: result.avatarUrl });
      }
      return true;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      return false;
    }
  };

  const fetchWalletData = useCallback(async () => {
    setIsLoadingWallet(true);
    setWalletError(null);
    try {
      const [walletInfo, transactionData] = await Promise.all([
        walletAPI.getWalletInfo(),
        walletAPI.getTransactions(),
      ]);

      setWalletBalance(walletInfo.balance);
      setPendingTransactions(walletInfo.pendingTransactions);
      setTransactions(transactionData);
    } catch (error) {
      const errorMessage = apiUtils.handleError(error as Error);
      setWalletError(errorMessage);
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setIsLoadingWallet(false);
    }
  }, []);

  const exportTransactions = async (): Promise<void> => {
    try {
      await walletAPI.exportTransactions();
      console.log('Transactions exported successfully');
    } catch (error) {
      console.error('Failed to export transactions:', error);
    }
  };

  const addFunds = async (amount: number): Promise<boolean> => {
    try {
      const result = await walletAPI.addFunds(amount);
      if (result.success) {
        await fetchWalletData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add funds:', error);
      return false;
    }
  };

  const login = async (_email: string, _password: string): Promise<boolean> => {
    try {
      // TODO: Implement actual login API call
      // const result = await authAPI.login(_email, _password);
      // After successful login, fetch the profile
      const result = await profileAPI.getProfile();
      setUser(result);
      return true;
    } catch (error) {
      console.error('Failed to login:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      apiUtils.clearToken();
      setUser(null);
      setBookings([]);
      setTransactions([]);
      setWalletBalance(0);
      setPendingTransactions(0);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  useEffect(() => {
    if (!apiUtils.isAuthenticated()) {
      console.log('User not authenticated - skipping data fetch');
      return;
    }

    const initializeDashboard = async () => {
      await Promise.all([fetchBookings(), fetchProfile(), fetchWalletData()]);
    };

    initializeDashboard();
  }, [fetchBookings, fetchProfile, fetchWalletData]);

  const refetchAll = useCallback(async () => {
    await Promise.all([fetchBookings(), fetchProfile(), fetchWalletData()]);
  }, [fetchBookings, fetchProfile, fetchWalletData]);

  const clearErrors = () => {
    setBookingsError(null);
    setProfileError(null);
    setWalletError(null);
  };

  return {
    bookings,
    user,
    transactions,
    walletBalance,
    pendingTransactions,

    isLoadingBookings,
    isLoadingProfile,
    isLoadingWallet,
    isLoading: isLoadingBookings || isLoadingProfile || isLoadingWallet,

    bookingsError,
    profileError,
    walletError,
    hasErrors: !!(bookingsError || profileError || walletError),

    fetchBookings,
    cancelBooking,
    confirmPayment,
    fetchProfile,
    updateProfile,
    uploadAvatar,

    fetchWalletData,
    exportTransactions,
    addFunds,

    login,
    logout,

    refetchAll,
    clearErrors,

    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === 'pending').length,
    confirmedBookings: bookings.filter((b) => b.status === 'confirmed').length,
    completedBookings: bookings.filter((b) => b.status === 'completed').length,
    cancelledBookings: bookings.filter((b) => b.status === 'cancelled').length,

    isAuthenticated: true,
  };
};
