/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../use-auth';

// Mock del Stellar Social SDK
const mockAuthenticateWithGoogleCredential = jest.fn();
const mockConnectFreighter = jest.fn();

jest.mock('~/lib/stellar-social-sdk', () => ({
  StellarSocialSDK: jest.fn().mockImplementation(() => ({
    authenticateWithGoogleCredential: mockAuthenticateWithGoogleCredential,
    connectFreighter: mockConnectFreighter,
  })),
}));

// Mock de react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    loading: jest.fn(() => 'toast-id'),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock de localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock de window.google
const mockGoogleAccounts = {
  id: {
    initialize: jest.fn(),
    renderButton: jest.fn(),
    prompt: jest.fn(),
    disableAutoSelect: jest.fn(),
  },
};

Object.defineProperty(window, 'google', {
  value: { accounts: mockGoogleAccounts },
  writable: true,
});

// Wrapper para el provider
const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();

    // Reset environment variables
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.NEXT_PUBLIC_CONTRACT_ID = 'test-contract-id';
    process.env.NEXT_PUBLIC_STELLAR_NETWORK = 'testnet';
  });

  describe('Initial State', () => {
    it('should start with no user authenticated', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.account).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.authMethod).toBeNull();
    });

    it('should restore session from localStorage', async () => {
      const storedUser = {
        publicKey: 'GTEST123',
        name: 'Test User',
        email: 'test@example.com',
        authMethod: 'google',
      };

      localStorageMock.setItem('stellar_social_user', JSON.stringify(storedUser));
      localStorageMock.setItem('stellar_social_auth_method', 'google');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(storedUser);
      expect(result.current.authMethod).toBe('google');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Google Authentication', () => {
    it('should authenticate with Google successfully', async () => {
      const mockAccount = {
        publicKey: 'GTEST456',
        data: {
          publicKey: 'GTEST456',
          authMethods: [
            {
              type: 'google',
              identifier: 'google-sub-123',
              metadata: {
                name: 'Google User',
                email: 'google@example.com',
              },
            },
          ],
          createdAt: Date.now(),
          recoveryContacts: [],
        },
        getBalance: jest.fn().mockResolvedValue([{ asset: 'XLM', balance: '100' }]),
      };

      mockAuthenticateWithGoogleCredential.mockResolvedValueOnce({
        success: true,
        account: mockAccount,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loginWithGoogle({ credential: 'mock-google-token' });
      });

      expect(mockAuthenticateWithGoogleCredential).toHaveBeenCalledWith({
        credential: 'mock-google-token',
      });

      expect(result.current.user?.publicKey).toBe('GTEST456');
      expect(result.current.user?.name).toBe('Google User');
      expect(result.current.authMethod).toBe('google');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle Google authentication failure', async () => {
      mockAuthenticateWithGoogleCredential.mockResolvedValueOnce({
        success: false,
        error: 'Authentication failed',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loginWithGoogle({ credential: 'invalid-token' });
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Freighter Authentication', () => {
    it('should authenticate with Freighter successfully', async () => {
      const mockAccount = {
        publicKey: 'GFREIGHTER789',
        data: {
          publicKey: 'GFREIGHTER789',
          authMethods: [{ type: 'freighter', identifier: 'GFREIGHTER789' }],
          createdAt: Date.now(),
          recoveryContacts: [],
        },
        getBalance: jest.fn().mockResolvedValue([{ asset: 'XLM', balance: '50' }]),
      };

      mockConnectFreighter.mockResolvedValueOnce({
        success: true,
        account: mockAccount,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loginWithFreighter();
      });

      expect(mockConnectFreighter).toHaveBeenCalled();
      expect(result.current.user?.publicKey).toBe('GFREIGHTER789');
      expect(result.current.authMethod).toBe('freighter');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle Freighter connection failure', async () => {
      mockConnectFreighter.mockResolvedValueOnce({
        success: false,
        error: 'Freighter not installed',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loginWithFreighter();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Logout', () => {
    it('should clear user session on logout', async () => {
      // Setup authenticated state
      const storedUser = {
        publicKey: 'GTEST123',
        name: 'Test User',
        authMethod: 'google',
      };

      localStorageMock.setItem('stellar_social_user', JSON.stringify(storedUser));
      localStorageMock.setItem('stellar_social_auth_method', 'google');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.account).toBeNull();
      expect(result.current.authMethod).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('stellar_social_user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('stellar_social_auth_method');
    });

    it('should disable Google auto-select on logout', async () => {
      const storedUser = {
        publicKey: 'GTEST123',
        name: 'Test User',
        authMethod: 'google',
      };

      localStorageMock.setItem('stellar_social_user', JSON.stringify(storedUser));
      localStorageMock.setItem('stellar_social_auth_method', 'google');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.authMethod).toBe('google');
      });

      act(() => {
        result.current.logout();
      });

      expect(mockGoogleAccounts.id.disableAutoSelect).toHaveBeenCalled();
    });
  });

  describe('Balance Operations', () => {
    it('should return empty array when no account', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const balances = await result.current.getBalance();
      expect(balances).toEqual([]);
    });
  });
});
