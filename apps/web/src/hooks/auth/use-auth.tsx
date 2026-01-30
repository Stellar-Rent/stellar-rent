'use client';

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import { StellarSocialSDK } from '~/lib/stellar-social-sdk';
import type {
  AuthContextType,
  BalanceInfo,
  CredentialResponse,
  SocialUser,
  StellarSocialAccount,
} from '~/types/auth';

const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID || 'CALZGCSB3P3WEBLW3QTF5Y4WEALEVTYUYBC7KBGQ266GDINT7U4E74KW';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const STELLAR_NETWORK = (process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet') as
  | 'testnet'
  | 'mainnet';

const STORAGE_KEYS = {
  USER: 'stellar_social_user',
  AUTH_METHOD: 'stellar_social_auth_method',
} as const;

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
  const [sdk, setSdk] = useState<StellarSocialSDK | null>(null);

  const sdkRef = useRef<StellarSocialSDK | null>(null);
  const setUserRef = useRef(setUser);
  const setIsLoadingRef = useRef(setIsLoading);

  useEffect(() => {
    sdkRef.current = sdk;
  }, [sdk]);

  useEffect(() => {
    setUserRef.current = setUser;
    setIsLoadingRef.current = setIsLoading;
  }, []);

  useEffect(() => {
    const initSDK = async () => {
      // Validation to prevent initialization error if variables are missing or default
      const isInvalidId = !GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('your-google-client-id');

      if (isInvalidId) {
        console.warn('SDK waiting for valid GOOGLE_CLIENT_ID');
        setIsLoading(false);
        return;
      }

      try {
        const stellarSDK = new StellarSocialSDK({
          contractId: CONTRACT_ID,
          network: STELLAR_NETWORK,
          googleClientId: GOOGLE_CLIENT_ID,
        });

        setSdk(stellarSDK);
        console.log('✅ Stellar Social SDK initialized');
      } catch (error) {
        console.error('❌ Failed to initialize SDK:', error);
        toast.error('Failed to initialize authentication system');
      } finally {
        setIsLoading(false);
      }
    };

    initSDK();
  }, []);

  useEffect(() => {
    const restoreSession = () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        const storedAuthMethod = localStorage.getItem(STORAGE_KEYS.AUTH_METHOD) as
          | 'google'
          | 'freighter'
          | null;

        if (storedUser && storedAuthMethod) {
          const parsedUser = JSON.parse(storedUser) as SocialUser;
          setUser(parsedUser);
          setAuthMethod(storedAuthMethod);
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        clearStorage();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    const restoreAccount = async () => {
      if (!sdk || !user || account) return;

      try {
        if (authMethod === 'freighter') {
          const { isConnected } = await import('@stellar/freighter-api');
          const result = await isConnected();

          if (result.isConnected === true) {
            const reconnectResult = await sdk.connectFreighter();
            if (reconnectResult.success && reconnectResult.account) {
              setAccount(reconnectResult.account as StellarSocialAccount);
            }
          } else {
            clearStorage();
            setUser(null);
            setAuthMethod(null);
          }
        }
      } catch (error) {
        console.error('Error restoring account:', error);
      }
    };

    restoreAccount();
  }, [sdk, user, authMethod, account]);

  useEffect(() => {
    if (!sdk || !GOOGLE_CLIENT_ID) return;

    const setupGoogleOAuth = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        window.handleGoogleCredential = handleGoogleAuthComplete;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleAuthComplete,
          auto_select: false,
          cancel_on_tap_outside: false,
          ux_mode: 'popup',
          context: 'signin',
          itp_support: true,
          use_fedcm_for_prompt: true,
        });
      } else {
        setTimeout(setupGoogleOAuth, 500);
      }
    };

    setTimeout(setupGoogleOAuth, 1000);
  }, [sdk]);

  const handleGoogleAuthComplete = useCallback(async (credentialResponse: CredentialResponse) => {
    const currentSdk = sdkRef.current;
    if (!credentialResponse?.credential || !currentSdk) return;

    setIsLoadingRef.current(true);
    const toastId = toast.loading('Creating your Stellar account...');

    try {
      const result = await currentSdk.authenticateWithGoogleCredential(credentialResponse);

      if (result.success && result.account) {
        const stellarAccount = result.account as StellarSocialAccount;
        const authMethodData = stellarAccount.data.authMethods[0];

        const socialUser: SocialUser = {
          publicKey: stellarAccount.publicKey,
          name: authMethodData?.metadata?.name,
          email: authMethodData?.metadata?.email,
          picture: authMethodData?.metadata?.picture,
          authMethod: 'google',
        };

        setUser(socialUser);
        setAccount(stellarAccount);
        setAuthMethod('google');

        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(socialUser));
        localStorage.setItem(STORAGE_KEYS.AUTH_METHOD, 'google');

        toast.success(`Welcome ${socialUser.name || 'User'}!`, { id: toastId });
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication error';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsLoadingRef.current(false);
    }
  }, []);

  const loginWithGoogle = useCallback(
    async (credentialResponse: CredentialResponse) => {
      await handleGoogleAuthComplete(credentialResponse);
    },
    [handleGoogleAuthComplete]
  );

  const loginWithFreighter = useCallback(async () => {
    if (!sdk) return;

    setIsLoading(true);
    const toastId = toast.loading('Connecting to Freighter...');

    try {
      const result = await sdk.connectFreighter();

      if (result.success && result.account) {
        const stellarAccount = result.account as StellarSocialAccount;

        const socialUser: SocialUser = {
          publicKey: stellarAccount.publicKey,
          name: 'Freighter User',
          authMethod: 'freighter',
        };

        setUser(socialUser);
        setAccount(stellarAccount);
        setAuthMethod('freighter');

        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(socialUser));
        localStorage.setItem(STORAGE_KEYS.AUTH_METHOD, 'freighter');

        toast.success('Wallet connected!', { id: toastId });
      } else {
        throw new Error(result.error || 'Failed to connect Freighter');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  const logout = useCallback(() => {
    setUser(null);
    setAccount(null);
    setAuthMethod(null);
    clearStorage();

    if (authMethod === 'google' && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }

    toast.success('Logged out');
  }, [authMethod]);

  const getBalance = useCallback(async (): Promise<BalanceInfo[]> => {
    if (!account) return [];
    try {
      return await account.getBalance();
    } catch (_error) {
      return [];
    }
  }, [account]);

  const sendPayment = useCallback(
    async (to: string, amount: string, memo?: string): Promise<string> => {
      if (!account) throw new Error('No active account');
      const toastId = toast.loading('Sending payment...');
      try {
        const txHash = await account.sendPayment(to, amount, undefined, memo);
        toast.success('Payment sent successfully', { id: toastId });
        return txHash;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send payment';
        toast.error(errorMessage, { id: toastId });
        throw error;
      }
    },
    [account]
  );

  const isAuthenticated = !!user && !!user.publicKey;

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        isAuthenticated,
        isLoading,
        authMethod,
        loginWithGoogle,
        loginWithFreighter,
        logout,
        getBalance,
        sendPayment,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.AUTH_METHOD);
  localStorage.removeItem('user');
  localStorage.removeItem('authToken');
  localStorage.removeItem('authType');
}

export const useAuth = () => useContext(AuthContext);
