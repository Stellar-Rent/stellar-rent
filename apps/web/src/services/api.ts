import type { ConfirmPaymentResponse, DashboardBooking, Transaction, UserProfile } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Define the expected shape of the backend response
interface BackendBooking {
  id: string;
  user_id?: string;
  property_id?: string;
  property_title?: string;
  propertyTitle?: string;
  property_location?: string;
  propertyLocation?: string;
  property_image?: string;
  propertyImage?: string;
  check_in?: string;
  checkIn?: string;
  check_out?: string;
  checkOut?: string;
  total_amount?: number;
  totalAmount?: number;
  created_at?: string;
  bookingDate?: string;
  status?: string;
  host_name?: string;
  hostName?: string;
  guests?: number;
  rating?: number;
  transaction_hash?: string;
  escrow_address?: string;
  updated_at?: string;
}

interface BackendProfile {
  user_id?: string;
  id?: string;
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  avatar?: string;
  created_at?: string;
  location?: string;
  bio?: string;
}

interface ChallengeResponse {
  challenge: string;
  expiresAt: string;
}

interface WalletAuthResponse {
  token: string;
  user: {
    id: string;
    publicKey: string;
    profile?: {
      name?: string;
      avatar_url?: string;
      phone?: string;
      address?: string;
      preferences?: Record<string, null>;
      social_links?: Record<string, null>;
      verification_status: string;
      last_active: string;
    };
  };
}

function transformBooking(backendBooking: BackendBooking): DashboardBooking {
  return {
    id: backendBooking.id,
    user_id: backendBooking.user_id,
    property_id: backendBooking.property_id,
    propertyTitle: backendBooking.property_title || backendBooking.propertyTitle || 'Property',
    propertyLocation:
      backendBooking.property_location ||
      backendBooking.propertyLocation ||
      'Location not specified',
    propertyImage:
      backendBooking.property_image ||
      backendBooking.propertyImage ||
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
    checkIn: backendBooking.check_in || backendBooking.checkIn || '',
    checkOut: backendBooking.check_out || backendBooking.checkOut || '',
    totalAmount: backendBooking.total_amount || backendBooking.totalAmount || 0,
    bookingDate: backendBooking.created_at || backendBooking.bookingDate || '',
    hostName: backendBooking.host_name || backendBooking.hostName || 'Host',
    canCancel: backendBooking.status === 'pending' || backendBooking.status === 'confirmed',
    guests: backendBooking.guests || 1,
    status:
      (backendBooking.status as 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled') ||
      'pending',
    rating: backendBooking.rating,
    transaction_hash: backendBooking.transaction_hash,
    escrow_address: backendBooking.escrow_address,
    created_at: backendBooking.created_at,
    updated_at: backendBooking.updated_at,
  };
}

function transformProfile(backendProfile: BackendProfile): UserProfile {
  return {
    id: backendProfile.user_id || backendProfile.id || '1',
    name: backendProfile.full_name || backendProfile.name || 'User',
    email: backendProfile.email || '',
    phone: backendProfile.phone || '',
    avatar:
      backendProfile.avatar_url ||
      backendProfile.avatar ||
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
    memberSince: backendProfile.created_at
      ? new Date(backendProfile.created_at).getFullYear().toString()
      : '2023',
    verified: true,
    location: backendProfile.location,
    bio: backendProfile.bio,
    preferences: {
      currency: 'USD',
      language: 'English',
      notifications: true,
    },
  };
}

// ===========================
// Transform wallet user to UserProfile
// ===========================
function transformWalletUser(walletUser: WalletAuthResponse['user']): UserProfile {
  return {
    id: walletUser.id,
    name: walletUser.profile?.name || 'Wallet User',
    email: '',
    phone: walletUser.profile?.phone || '',
    avatar:
      walletUser.profile?.avatar_url ||
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
    memberSince: walletUser.profile?.last_active
      ? new Date(walletUser.profile.last_active).getFullYear().toString()
      : new Date().getFullYear().toString(),
    verified: walletUser.profile?.verification_status === 'verified',
    location: walletUser.profile?.address,
    bio: '',
    preferences: {
      currency: 'USD',
      language: 'English',
      notifications: true,
    },
    publicKey: walletUser.publicKey,
  };
}

// Utility function for file downloads
function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Remove token from localStorage - backend uses HTTP-only cookies
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  console.log(`🌐 API Call: ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);
  if (options.body) {
    console.log('📤 Request body:', options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // This ensures cookies are sent
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    }

    if (response.status === 401) {
      // Clear local storage and redirect on auth failure
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('authType');
        window.location.href = '/login';
      }
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result;
}

export const bookingAPI = {
  // ===========================
  // creating booking
  // ===========================
  createBooking: async (input: {
    propertyId: string;
    userId: string;
    dates: { from: Date; to: Date };
    guests: number;
    total: number;
    deposit: number;
  }): Promise<{ bookingId: string; escrowAddress: string; status: string }> => {
    try {
      const response = await apiCall<{
        success: boolean;
        data: {
          message: string;
          bookingId: string;
          escrowAddress: string;
          status: string;
        };
      }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: input.propertyId,
          userId: input.userId,
          dates: {
            from: input.dates.from.toISOString(),
            to: input.dates.to.toISOString(),
          },
          guests: input.guests,
          total: input.total,
          deposit: input.deposit,
        }),
      });
      if (!response.success) {
        throw new Error(response.data?.message || 'Failed to create booking on backend');
      }
      return response.data;
    } catch (error) {
      console.error('Failed to create booking:', error);
      throw error;
    }
  },
  // ===========================
  // confirmBlockchainPayment
  // ===========================
  confirmBlockchainPayment: async (
    bookingId: string,
    transactionHash: string,
    sourcePublicKey: string,
    escrowAddress: string
  ): Promise<ConfirmPaymentResponse> => {
    try {
      return await apiCall<ConfirmPaymentResponse>(`/api/bookings/${bookingId}/confirm-payment`, {
        method: 'POST',
        body: JSON.stringify({ transactionHash, sourcePublicKey, escrowAddress }),
      });
    } catch (error) {
      console.error('Failed to confirm blockchain payment:', error);
      throw error;
    }
  },
  getBookings: async (): Promise<DashboardBooking[]> => {
    try {
      const rawBookings = await apiCall<BackendBooking[]>('/api/bookings');
      return rawBookings.map(transformBooking);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      throw error;
    }
  },

  getBooking: async (id: string): Promise<DashboardBooking> => {
    try {
      const rawBooking = await apiCall<BackendBooking>(`/api/bookings/${id}`);
      return transformBooking(rawBooking);
    } catch (error) {
      console.error('Failed to fetch booking:', error);
      throw error;
    }
  },

  cancelBooking: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      return await apiCall(`/api/bookings/${id}/cancel`, { method: 'PUT' });
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      return { success: false, message: 'Failed to cancel booking' };
    }
  },

  confirmPayment: async (
    bookingId: string,
    transactionHash: string
  ): Promise<ConfirmPaymentResponse> => {
    try {
      return await apiCall<ConfirmPaymentResponse>(`/api/bookings/${bookingId}/confirm-payment`, {
        method: 'POST',
        body: JSON.stringify({ transactionHash }),
      });
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      throw error;
    }
  },

  updateBooking: async (id: string, data: Partial<DashboardBooking>): Promise<DashboardBooking> => {
    try {
      const rawBooking = await apiCall<BackendBooking>(`/api/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return transformBooking(rawBooking);
    } catch (error) {
      console.error('Failed to update booking:', error);
      throw error;
    }
  },
};

export const profileAPI = {
  getProfile: async (): Promise<UserProfile> => {
    try {
      const rawProfile = await apiCall<BackendProfile>('/profiles/me');
      return transformProfile(rawProfile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw error;
    }
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const backendData = {
        full_name: data.name,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        location: data.location,
      };

      const rawProfile = await apiCall<BackendProfile>('/profiles/me', {
        method: 'PUT',
        body: JSON.stringify(backendData),
      });
      return transformProfile(rawProfile);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_BASE_URL}/profiles/avatar`, {
        method: 'POST',
        credentials: 'include', // Use cookies instead of Authorization header
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
    }
  },

  deleteAccount: async (): Promise<{ success: boolean }> => {
    try {
      return await apiCall<{ success: boolean }>('/profiles/me', {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  },
};

export const walletAPI = {
  getWalletInfo: async (): Promise<{ balance: number; pendingTransactions: number }> => {
    try {
      return await apiCall<{ balance: number; pendingTransactions: number }>('/wallet/info');
    } catch (error) {
      console.error('Failed to fetch wallet info:', error);
      throw error;
    }
  },

  getTransactions: async (): Promise<Transaction[]> => {
    try {
      return await apiCall<Transaction[]>('/wallet/transactions');
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw error;
    }
  },

  addFunds: async (amount: number): Promise<{ success: boolean; transaction: Transaction }> => {
    try {
      return await apiCall('/wallet/add-funds', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
    } catch (error) {
      console.error('Failed to add funds:', error);
      throw error;
    }
  },

  exportTransactions: async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/export`, {
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        downloadFile(blob, 'transactions.csv');
      }
    } catch (error) {
      console.error('Failed to export transactions:', error);
      console.log('Export transactions - endpoint not available yet');
    }
  },
};

export const authAPI = {
  login: async (email: string, password: string): Promise<{ token: string; user: UserProfile }> => {
    try {
      const response = await apiCall<{ token: string; user: BackendProfile }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      return {
        token: response.token,
        user: transformProfile(response.user),
      };
    } catch (error) {
      console.error('Failed to login:', error);
      throw error;
    }
  },

  register: async (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<{ token: string; user: UserProfile }> => {
    try {
      const response = await apiCall<{ token: string; user: BackendProfile }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      return {
        token: response.token,
        user: transformProfile(response.user),
      };
    } catch (error) {
      console.error('Failed to register:', error);
      throw error;
    }
  },

  // ===========================
  // Wallet authentication methods
  // ===========================
  requestChallenge: async (publicKey: string): Promise<ChallengeResponse> => {
    try {
      return await apiCall<ChallengeResponse>('/api/auth/challenge', {
        method: 'POST',
        body: JSON.stringify({ publicKey }),
      });
    } catch (error) {
      console.error('Failed to request challenge:', error);
      throw error;
    }
  },

  // ===========================
  // Authenticate wallet
  // ===========================
  authenticateWallet: async (
    publicKey: string,
    signedTransaction: string,
    challenge: string
  ): Promise<{ token: string; user: UserProfile }> => {
    try {
      const response = await apiCall<WalletAuthResponse>('/api/auth/wallet', {
        method: 'POST',
        body: JSON.stringify({ publicKey, signedTransaction, challenge }),
      });

      return {
        token: response.token,
        user: transformWalletUser(response.user),
      };
    } catch (error) {
      console.error('Failed to authenticate wallet:', error);
      throw error;
    }
  },

  logout: async (): Promise<{ success: boolean }> => {
    try {
      const result = await apiCall<{ success: boolean }>('/auth/logout', {
        method: 'POST',
      });
      return result;
    } catch (error) {
      console.error('Failed to logout:', error);
      return { success: true };
    }
  },

  refreshToken: async (): Promise<{ token: string }> => {
    try {
      return await apiCall<{ token: string }>('/auth/refresh', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  },
};

export const apiUtils = {
  handleError: (error: Error | { message?: string }): string => {
    if (error && typeof error === 'object' && 'message' in error) {
      if (error.message?.includes('401')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('authType');
          window.location.href = '/login';
        }
      }
      return error.message || 'An unexpected error occurred';
    }
    return 'An unexpected error occurred';
  },

  formatDate: (date: Date): string => {
    return date.toISOString().split('T')[0];
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    // Check if user data exists (since we're using HTTP-only cookies for tokens)
    return !!localStorage.getItem('user');
  },

  // Remove token management functions since we use HTTP-only cookies
  clearAuth: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('authType');
    }
  },
};
