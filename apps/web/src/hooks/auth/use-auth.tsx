'use client';

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { signTransactionWithFreighter } from '~/lib/freighter-utils';
import { getNetworkName, getNetworkPassphrase, logNetworkInfo } from '~/lib/network-utils';
import { apiUtils, authAPI } from '../../services/api';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authType, setAuthType] = useState<'email' | 'wallet' | null>(null);
  const { network, networkPassphrase, getPublicKey } = useWallet();

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      const storedAuthType = localStorage.getItem('authType') as 'email' | 'wallet' | null;

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setAuthType(storedAuthType);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          apiUtils.clearAuth();
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
      // Get public key (this handles connection if needed)
      const walletPublicKey = await getPublicKey();
      if (!walletPublicKey) {
        throw new Error('Failed to get public key from wallet');
      }

      console.log('🔑 Using public key:', walletPublicKey);

      // Debug network information
      logNetworkInfo(network, 'TESTNET');

      // Request challenge from backend
      const challengeResponse = await authAPI.requestChallenge(walletPublicKey);

      try {
        const { TransactionBuilder, Account, Memo, BASE_FEE } = await import(
          '@stellar/stellar-sdk'
        );

        const challengeText = challengeResponse.challenge;
        if (challengeText.length > 28) {
          throw new Error('Challenge too long for transaction memo');
        }

        // Use the wallet's current network, but ensure it matches what we expect
        const walletNetworkPassphrase = networkPassphrase || getNetworkPassphrase(network);
        const targetNetworkName = getNetworkName(network);

        console.log('🌐 Transaction Network Info:');
        console.log('  Wallet Network:', network);
        console.log('  Wallet Passphrase:', networkPassphrase);
        console.log('  Using Passphrase:', walletNetworkPassphrase);
        console.log('  Target Network Name:', targetNetworkName);

        // Create memo-only transaction (no operations as backend expects)
        const account = new Account(walletPublicKey, '0');
        const transaction = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: walletNetworkPassphrase, // Use wallet's actual network
        })
          .addMemo(Memo.text(challengeText)) // Only memo, no operations
          .setTimeout(30)
          .build();

        console.log('📝 Transaction created for network:', walletNetworkPassphrase);

        // Sign transaction - use the wallet's current network
        const signResult = await signTransactionWithFreighter(transaction.toXDR(), {
          network: targetNetworkName,
          networkPassphrase: walletNetworkPassphrase,
          address: walletPublicKey,
        });

        if (signResult.error) {
          throw new Error(signResult.error);
        }

        if (!signResult.signedTxXdr) {
          throw new Error('No signed transaction returned');
        }

        console.log('✅ Transaction signed successfully');

        // Authenticate with backend
        const authResponse = await authAPI.authenticateWallet(
          walletPublicKey,
          signResult.signedTxXdr,
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
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authType', 'wallet');

        console.log('🎉 Wallet authentication successful!');
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
        loginWithWallet,
        logout,
        isAuthenticated,
        authType,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
