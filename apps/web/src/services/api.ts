import type {
  APIResponse,
  AccountDetails,
  Booking,
  BookingFilters,
  BookingFormData,
  DateRangeFilter,
  Notification,
  NotificationFilters,
  PaginatedResponse,
  ProfileFormData,
  Property,
  PropertyAvailabilityData,
  PropertyFilters,
  PropertyFormData,
  PropertyUpdateData,
  Transaction,
  UserProfile,
} from '../types/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Utility function to safely convert filters to URL parameters
const createURLParams = (
  baseParams: Record<string, string>,
  filters?: BookingFilters | PropertyFilters | Record<string, unknown>
): URLSearchParams => {
  const params = new URLSearchParams(baseParams);

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        // Convert all values to strings for URLSearchParams
        params.append(key, String(value));
      }
    }
  }

  return params;
};

interface ChallengeResponse {
  challenge: string;
  expiresAt: string;
}

// Generic API call function
const _apiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('authToken');
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(options.headers as Record<string, string> || {})
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'API request failed');
    }

    // For 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Transform wallet user function
const _transformWalletUser = (user: Record<string, unknown>): UserProfile => {
  return {
    id: String(user.id || user.user_id || ''),
    name: String(user.name || user.full_name || ''),
    email: String(user.email || ''),
    avatar: String(user.avatar || user.avatar_url || ''),
    phone: user.phone ? String(user.phone) : undefined,
    location: user.location ? String(user.location) : undefined,
    bio: user.bio ? String(user.bio) : undefined,
    memberSince: String(user.created_at || new Date().toISOString()),
    totalBookings: Number(user.total_bookings || 0),
    totalSpent: Number(user.total_spent || 0),
    preferences: {
      notifications: true,
      emailUpdates: true,
      pushNotifications: false,
    },
  };
};

interface WalletAuthResponse {
  token: string;
  user: Record<string, unknown>;
}

export const apiUtils = {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('authToken');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },

  clearAuth() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
};

export const profileAPI = {
  async getUserProfile(userId: string) {
    return apiUtils.request(`/profile/${userId}`);
  },

  async updateUserProfile(
    userId: string,
    updates: Partial<ProfileFormData>
  ): Promise<APIResponse<UserProfile>> {
    return apiUtils.request(`/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async uploadAvatar(userId: string, file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    return apiUtils.request(`/profile/${userId}/avatar`, {
      method: 'POST',
      headers: {},
      body: formData,
    });
  },

  async deleteAccount(userId: string) {
    return apiUtils.request(`/profile/${userId}`, {
      method: 'DELETE',
    });
  },
};

export const bookingAPI = {
  async getBookings(userId: string, filters?: BookingFilters): Promise<APIResponse<Booking[]>> {
    const params = createURLParams({ userId }, filters);
    return apiUtils.request(`/bookings?${params}`);
  },

  async getBookingById(bookingId: string) {
    return apiUtils.request(`/bookings/${bookingId}`);
  },

  async createBooking(bookingData: BookingFormData): Promise<APIResponse<Booking>> {
    return apiUtils.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  async cancelBooking(bookingId: string) {
    return apiUtils.request(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
    });
  },

  async confirmBooking(bookingId: string) {
    return apiUtils.request(`/bookings/${bookingId}/confirm`, {
      method: 'POST',
    });
  },

  async getBookingHistory(
    userId: string,
    filters?: BookingFilters
  ): Promise<APIResponse<Booking[]>> {
    const params = createURLParams({ userId }, filters);
    return apiUtils.request(`/bookings/history?${params}`);
  },
};

export const propertyAPI = {
  async getProperties(userId: string, filters?: PropertyFilters): Promise<APIResponse<Property[]>> {
    const params = createURLParams({ userId }, filters);
    return apiUtils.request(`/properties?${params}`);
  },

  async getPropertyById(propertyId: string) {
    return apiUtils.request(`/properties/${propertyId}`);
  },

  async createProperty(propertyData: PropertyFormData): Promise<APIResponse<Property>> {
    return apiUtils.request('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  },

  async updateProperty(
    propertyId: string,
    updates: PropertyUpdateData
  ): Promise<APIResponse<Property>> {
    return apiUtils.request(`/properties/${propertyId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteProperty(propertyId: string) {
    return apiUtils.request(`/properties/${propertyId}`, {
      method: 'DELETE',
    });
  },

  async togglePropertyStatus(propertyId: string, status: string) {
    return apiUtils.request(`/properties/${propertyId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async getPropertyAnalytics(
    propertyId: string,
    dateRange?: DateRangeFilter
  ): Promise<APIResponse<Record<string, unknown>>> {
    const params = new URLSearchParams({ propertyId, ...dateRange });
    return apiUtils.request(`/properties/${propertyId}/analytics?${params}`);
  },

  async updatePropertyAvailability(
    propertyId: string,
    availability: PropertyAvailabilityData
  ): Promise<APIResponse<Property>> {
    return apiUtils.request(`/properties/${propertyId}/availability`, {
      method: 'PUT',
      body: JSON.stringify(availability),
export const walletAPI = {
  getWalletBalance: async (userId: string) => {
    try {
      const response = await fetch(`/api/wallets/${userId}/balance`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      return {
        success: false,
        data: { balance: 0, currency: 'USD' },
        message: 'Failed to load wallet balance'
      };
    }
  },
  
  getTransactionHistory: async (userId: string, filters?: Record<string, unknown>) => {
    try {
      const params = new URLSearchParams({ userId });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, String(value));
        });
      }
      const response = await fetch(`/api/wallets/${userId}/transactions?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to load transaction history'
      };
    }
  },
  
  addFunds: async (userId: string, amount: number, paymentMethod: string) => {
    try {
      const response = await fetch(`/api/wallets/${userId}/deposit`, {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethod }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to add funds:', error);
      throw new Error('Failed to process deposit');
    }
  },
  
  withdrawFunds: async (userId: string, amount: number, accountDetails: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/wallets/${userId}/withdraw`, {
        method: 'POST',
        body: JSON.stringify({ amount, accountDetails }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to withdraw funds:', error);
      throw new Error('Failed to process withdrawal');
    }
  },
};

export const notificationAPI = {
  async getNotifications(userId: string, filters?: Record<string, unknown>) {
{{ ... }}
    });
  },
};

export const dashboardAPI = {
  getDashboardStats: async (userId: string, userType: 'host' | 'tenant') => {
    try {
      const response = await fetch(`/api/analytics/overview?userId=${userId}&userType=${userType}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      return {
        success: false,
        data: {
          totalBookings: 0,
          totalEarnings: 0,
          activeListings: 0,
          pendingRequests: 0
        },
        message: 'Failed to load dashboard stats'
      };
    }
  },
  
  getRecentActivity: async (userId: string, userType: 'host' | 'tenant') => {
    try {
      const response = await fetch(`/api/activity/recent?userId=${userId}&userType=${userType}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to load recent activity'
      };
    }
  },
  
  getEarningsAnalytics: async (userId: string, dateRange?: Record<string, unknown>) => {
    try {
      const params = new URLSearchParams({ userId });
      if (dateRange) {
        Object.entries(dateRange).forEach(([key, value]) => {
          if (value) params.append(key, String(value));
        });
      }
      const response = await fetch(`/api/analytics/earnings?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch earnings analytics:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to load earnings analytics'
      };
    }
  },
  
  getBookingAnalytics: async (
    userId: string,
    userType: 'host' | 'tenant',
    dateRange?: Record<string, unknown>
  ) => {
    try {
      const params = new URLSearchParams({ userId, userType });
      if (dateRange) {
        Object.entries(dateRange).forEach(([key, value]) => {
          if (value) params.append(key, String(value));
        });
      }
      const response = await fetch(`/api/analytics/bookings?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch booking analytics:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to load booking analytics'
      };
    }
  },
};

export const authAPI = {
  async login(email: string, password: string) {
{{ ... }}
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(email: string, password: string, fullName: string) {
    return apiUtils.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name: fullName }),
    });
  },

  async requestChallenge(publicKey: string): Promise<ChallengeResponse> {
    return apiUtils.request('/auth/challenge', {
      method: 'POST',
      body: JSON.stringify({ publicKey }),
    });
  },

  async authenticateWallet(
    publicKey: string,
    signedTxXdr: string,
    challenge: string
  ): Promise<WalletAuthResponse> {
    return apiUtils.request('/auth/wallet', {
      method: 'POST',
      body: JSON.stringify({ publicKey, signedTxXdr, challenge }),
    });
  },

  async logout() {
    // No logout endpoint found in backend - just clear client-side
    return Promise.resolve();
  },
};

export const handleAPIError = (error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (errorMessage.includes('401')) {
    apiUtils.clearAuth();
    window.location.href = '/login';
    return 'Session expired. Please login again.';
  }

  if (errorMessage.includes('403')) {
    return 'You do not have permission to perform this action.';
  }

  if (errorMessage.includes('404')) {
    return 'The requested resource was not found.';
  }

  if (errorMessage.includes('500')) {
    return 'Server error. Please try again later.';
  }

  return errorMessage || 'An unexpected error occurred.';
};
