import { act, renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useDashboard } from '../useDashboard';

// Mock retryApiCall to avoid delays in tests
vi.mock('../useApiCall', () => ({
  retryApiCall: vi.fn((fn) => fn()),
}));

// Set up global fetch mock
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('useDashboard', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading states set during initial fetch', async () => {
    // Mock the responses for initial fetch
    mockFetch.mockImplementation((url) => {
      if (url === '/api/bookings') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { bookings: [] } }),
        });
      }
      if (url === '/api/profile') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: '1', name: 'Test User' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoadingBookings).toBe(false);
      expect(result.current.isLoadingProfile).toBe(false);
    });

    expect(result.current.user).toMatchObject({ name: 'Test User' });
  });

  it('should handle fetch errors correctly', async () => {
    mockFetch.mockImplementation((url) => {
      if (url === '/api/bookings') {
        return Promise.resolve({
          ok: false,
          statusText: 'Internal Server Error',
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoadingBookings).toBe(false);
    });

    expect(result.current.bookingsError).toContain('Failed to fetch bookings');
    expect(result.current.bookings).toEqual([]);
  });

  it('should successfully cancel a booking', async () => {
    const { result } = renderHook(() => useDashboard());

    // Wait for initial load
    await waitFor(() => expect(result.current.isLoadingBookings).toBe(false));

    const success = await result.current.cancelBooking('test-id');

    expect(success).toBe(true);
  });

  it('should successfully update user profile', async () => {
    const { result } = renderHook(() => useDashboard());

    // Wait for initial load to finish first
    await waitFor(() => expect(result.current.isLoadingProfile).toBe(false));

    const newProfile = {
      id: '1',
      name: 'Updated Name',
      email: 'test@example.com',
      avatar: '',
      memberSince: '2023',
      totalBookings: 0,
      totalSpent: 0,
      verified: true,
      preferences: {
        currency: 'USD',
        language: 'en',
        notifications: true,
        emailUpdates: true,
        pushNotifications: false,
      },
    };

    let success = false;
    await act(async () => {
      success = await result.current.updateProfile(newProfile);
    });

    expect(success).toBe(true);
    expect(result.current.user).toEqual(newProfile);
  });
});
