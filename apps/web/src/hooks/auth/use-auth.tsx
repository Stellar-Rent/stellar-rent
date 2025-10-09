'use client';

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { signTransactionWithFreighter } from '~/lib/freighter-utils';
import { getNetworkName, getNetworkPassphrase, logNetworkInfo } from '~/lib/network-utils';
import { apiUtils, authAPI } from '../../services/api';
import { useWallet } from '../useWallet';
import { authConfig } from '~/config/auth.config';

export type Role = 'guest' | 'host' | 'dual';

interface User {
  id: string;
  email?: string;
  name: string;
  role?: Role;
  hostStatus?: 'none' | 'pending' | 'verified';
  hasProperties?: boolean;
  propertyCount?: number;
  hasBookings?: boolean;
  bookingCount?: number;
  hostSince?: string;
  publicKey?: string;
  authType?: 'email' | 'wallet';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  loginWithWallet: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  authType: 'email' | 'wallet' | null;
  loginAsMockUser: (role: Role) => void; // NEW: login as mock user
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  loginWithWallet: async () => {},
  logout: async () => {},
  isAuthenticated: false,
  authType: null,
  loginAsMockUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authType, setAuthType] = useState<'email' | 'wallet' | null>(null);
  const { network, networkPassphrase, getPublicKey } = useWallet();

  // --- MOCK USER LOGIN ---
  const loginAsMockUser = (role: Role) => {
    if (!authConfig.MOCK_USERS[role]) return;
    const mockUser = authConfig.MOCK_USERS[role];
    setUser(mockUser);
    setAuthType(mockUser.authType || 'email');
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('authType', mockUser.authType || 'email');
    console.log('✅ Logged in as mock user:', role);
  };

  // --- CHECK LOCAL STORAGE ON INIT ---
  useEffect(() => {
    if (authConfig.MOCK_AUTH) {
      const storedUser = localStorage.getItem('user');
      const storedAuthType = localStorage.getItem('authType') as 'email' | 'wallet' | null;

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setAuthType(storedAuthType);
          console.log('🔥 MOCK AUTH MODE ENABLED');
        } catch (error) {
          console.error('Error parsing stored user:', error);
          apiUtils.clearAuth();
        }
      }
    }
  }, []);

  // --- EXISTING LOGIN ---
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = (await authAPI.login(email, password)) as {
        token: string;
        user: { id: string; email: string; name: string };
      };
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        authType: 'email',
      };
      setUser(userData);
      setAuthType('email');
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authType', 'email');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // --- EXISTING REGISTER ---
  const register = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const response = (await authAPI.register(email, password, fullName)) as {
        token: string;
        user: { id: string; email: string; name: string };
      };
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        authType: 'email',
      };
      setUser(userData);
      setAuthType('email');
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authType', 'email');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // --- EXISTING WALLET LOGIN ---
  const loginWithWallet = async () => {
    setIsLoading(true);
    try {
      const walletPublicKey = await getPublicKey();
      if (!walletPublicKey) throw new Error('Failed to get public key from wallet');

      logNetworkInfo(network, 'TESTNET');

      const challengeResponse = await authAPI.requestChallenge(walletPublicKey);

      const { TransactionBuilder, Account, Memo, BASE_FEE } = await import('@stellar/stellar-sdk');
      const challengeText = challengeResponse.challenge;
      if (challengeText.length > 28) throw new Error('Challenge too long for transaction memo');

      const walletNetworkPassphrase = networkPassphrase || getNetworkPassphrase(network);
      const targetNetworkName = getNetworkName(network);

      const account = new Account(walletPublicKey, '0');
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: walletNetworkPassphrase,
      })
        .addMemo(Memo.text(challengeText))
        .setTimeout(30)
        .build();

      const signResult = await signTransactionWithFreighter(transaction.toXDR(), {
        network: targetNetworkName,
        networkPassphrase: walletNetworkPassphrase,
        address: walletPublicKey,
      });

      if (signResult.error) throw new Error(signResult.error);
      if (!signResult.signedTxXdr) throw new Error('No signed transaction returned');

      const authResponse = await authAPI.authenticateWallet(
        walletPublicKey,
        signResult.signedTxXdr,
        challengeResponse.challenge
      );

      const userData: User = {
        id: (authResponse.user as { id: string; name?: string }).id,
        name: (authResponse.user as { id: string; name?: string }).name || 'Wallet User',
        publicKey: walletPublicKey,
        authType: 'wallet',
      };

      setUser(userData);
      setAuthType('wallet');
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authType', 'wallet');
      console.log('🎉 Wallet authentication successful!');
    } catch (error) {
      console.error('Wallet login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // --- EXISTING LOGOUT ---
  const logout = async () => {
    setIsLoading(true);
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setAuthType(null);
      apiUtils.clearAuth();
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        loginWithWallet,
        logout,
        isAuthenticated,
        authType,
        loginAsMockUser, // mock user method
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
