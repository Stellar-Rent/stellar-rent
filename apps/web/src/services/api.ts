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
    });
  },
};

export const walletAPI = {
  async getWalletBalance(userId: string) {
    return apiUtils.request(`/wallet/${userId}/balance`);
  },

  async getTransactionHistory(userId: string, filters?: Record<string, unknown>) {
    const params = new URLSearchParams({ userId, ...filters });
    return apiUtils.request(`/wallet/${userId}/transactions?${params}`);
  },

  async addFunds(userId: string, amount: number, paymentMethod: string) {
    return apiUtils.request(`/wallet/${userId}/add-funds`, {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod }),
    });
  },

  async withdrawFunds(userId: string, amount: number, accountDetails: Record<string, unknown>) {
    return apiUtils.request(`/wallet/${userId}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ amount, accountDetails }),
    });
  },
};

export const notificationAPI = {
  async getNotifications(userId: string, filters?: Record<string, unknown>) {
    const params = new URLSearchParams({ userId, ...filters });
    return apiUtils.request(`/notifications?${params}`);
  },

  async markAsRead(notificationId: string) {
    return apiUtils.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  async markAllAsRead(userId: string) {
    return apiUtils.request(`/notifications/${userId}/read-all`, {
      method: 'PUT',
    });
  },

  async deleteNotification(notificationId: string) {
    return apiUtils.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },

  async deleteAllNotifications(userId: string) {
    return apiUtils.request(`/notifications/${userId}/delete-all`, {
      method: 'DELETE',
    });
  },
};

export const dashboardAPI = {
  async getDashboardStats(userId: string, userType: 'host' | 'tenant') {
    return apiUtils.request(`/dashboard/${userType}/${userId}/stats`);
  },

  async getRecentActivity(userId: string, userType: 'host' | 'tenant') {
    return apiUtils.request(`/dashboard/${userType}/${userId}/activity`);
  },

  async getEarningsAnalytics(userId: string, dateRange?: Record<string, unknown>) {
    const params = new URLSearchParams({ userId, ...dateRange });
    return apiUtils.request(`/dashboard/host/${userId}/earnings?${params}`);
  },

  async getBookingAnalytics(
    userId: string,
    userType: 'host' | 'tenant',
    dateRange?: Record<string, unknown>
  ) {
    const params = new URLSearchParams({ userId, ...dateRange });
    return apiUtils.request(`/dashboard/${userType}/${userId}/bookings/analytics?${params}`);
  },
};

export const authAPI = {
  async login(email: string, password: string) {
    return apiUtils.request('/auth/login', {
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
