'use client';

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { StellarSocialSDK } from '~/lib/stellar-social-sdk';
import type { AuthContextType, SocialUser, StellarSocialAccount } from '~/types/auth';

const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID || 'CALZGCSB3P3WEBLW3QTF5Y4WEALEVTYUYBC7KBGQ266GDINT7U4E74KW';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const STELLAR_NETWORK = (process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet') as
  | 'testnet'
  | 'mainnet';

const AuthContext = createContext<AuthContextType>({
  user: null,
  account: null,
  isAuthenticated: false,
  isLoading: true,
  authMethod: null,
  loginWithGoogle: async () => {},
  loginWithFreighter: async () => {},
  logout: () => {},
  getBalance: async () => [],
  sendPayment: async () => '',
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SocialUser | null>(null);
  const [account, setAccount] = useState<StellarSocialAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<'google' | 'freighter' | null>(null);
  const [_sdk, setSdk] = useState<any | null>(null);

  useEffect(() => {
    const initSDK = async () => {
      // Evitamos ejecución en servidor o sin Client ID
      if (typeof window === 'undefined' || !GOOGLE_CLIENT_ID) {
        setIsLoading(false);
        return;
      }

      try {
        if (StellarSocialSDK) {
          const SdkConstructor = StellarSocialSDK as any;
          const instance = new SdkConstructor({
            contractId: CONTRACT_ID,
            network: STELLAR_NETWORK,
            googleClientId: GOOGLE_CLIENT_ID,
          });
          setSdk(instance);
          console.log('✅ Stellar Social SDK initialized');
        }
      } catch (error) {
        console.error('❌ Failed to initialize SDK:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSDK();
  }, []);

  // Lógica de login/logout (implementación simplificada para el build)
  const logout = () => {
    setUser(null);
    setAccount(null);
    setAuthMethod(null);
    localStorage.removeItem('stellar_social_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        isAuthenticated: !!user?.publicKey,
        isLoading,
        authMethod,
        loginWithGoogle: async () => {},
        loginWithFreighter: async () => {},
        logout,
        getBalance: async () => [],
        sendPayment: async () => '',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
