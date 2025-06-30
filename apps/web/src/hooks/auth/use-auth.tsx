'use client';

import { Account, Memo, Networks, TransactionBuilder } from '@stellar/stellar-sdk';
import { createContext, useContext, useEffect, useState } from 'react';
import { apiUtils, authAPI } from '~/services/api';
import { useWallet } from '../useWallet';

interface User {
  id: string;
  email?: string;
  name: string;
  publicKey?: string;
  authType?: 'email' | 'wallet';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithWallet: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  authType: 'email' | 'wallet' | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  login: async () => {},
  loginWithWallet: async () => {},
  logout: async () => {},
  isAuthenticated: false,
  authType: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authType, setAuthType] = useState<'email' | 'wallet' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { connect, publicKey, isConnected } = useWallet();

  useEffect(() => {
    const checkAuth = () => {
      const token = apiUtils.getToken();
      const storedUser = localStorage.getItem('user');
      const storedAuthType = localStorage.getItem('authType') as 'email' | 'wallet' | null;

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setAuthType(storedAuthType);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          apiUtils.clearToken();
          localStorage.removeItem('user');
          localStorage.removeItem('authType');
        }
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(email, password);
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        authType: 'email',
      };
      setUser(userData);
      setAuthType('email');

      apiUtils.setToken(response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authType', 'email');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithWallet = async () => {
    setIsLoading(true);
    try {
      if (!isConnected || !publicKey) {
        await connect();
      }

      const walletPublicKey = publicKey;
      if (!walletPublicKey) {
        throw new Error('Failed to get public key from wallet');
      }
      const challengeResponse = await authAPI.requestChallenge(walletPublicKey);

      if (typeof window === 'undefined' || !window.freighterApi) {
        throw new Error('Freighter wallet not found');
      }

      try {
        const account = new Account(walletPublicKey, '0');

        const transaction = new TransactionBuilder(account, {
          fee: '100',
          networkPassphrase: Networks.TESTNET,
        })
          .addMemo(Memo.text(challengeResponse.challenge))
          .setTimeout(30)
          .build();
        const signedTransactionXDR = await window.freighterApi.signTransaction(transaction.toXDR());
        const authResponse = await authAPI.authenticateWallet(
          walletPublicKey,
          signedTransactionXDR,
          challengeResponse.challenge
        );

        const userData: User = {
          id: authResponse.user.id,
          name: authResponse.user.name || 'Wallet User',
          publicKey: walletPublicKey,
          authType: 'wallet',
        };

        setUser(userData);
        setAuthType('wallet');

        apiUtils.setToken(authResponse.token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authType', 'wallet');
      } catch (signError) {
        console.error('Error creating or signing transaction:', signError);
        throw new Error('Failed to sign authentication transaction');
      }
    } catch (error) {
      console.error('Wallet login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setUser(null);
      setAuthType(null);
      apiUtils.clearToken();
      localStorage.removeItem('user');
      localStorage.removeItem('authType');
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, loginWithWallet, logout, isAuthenticated, authType }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
