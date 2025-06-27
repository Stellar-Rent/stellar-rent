import type {
  ConfirmPaymentInput,
  ConfirmPaymentResponse,
  DashboardBooking,
  Transaction,
  UserProfile,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

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
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

export const bookingAPI = {
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

      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const response = await fetch(`${API_BASE_URL}/profiles/avatar`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const response = await fetch(`${API_BASE_URL}/wallet/export`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
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

  logout: async (): Promise<{ success: boolean }> => {
    try {
      const result = await apiCall<{ success: boolean }>('/auth/logout', {
        method: 'POST',
      });

      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }

      return result;
    } catch (error) {
      console.error('Failed to logout:', error);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
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
          localStorage.removeItem('authToken');
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
    return !!localStorage.getItem('authToken');
  },

  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  },

  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  },

  clearToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  },
};
