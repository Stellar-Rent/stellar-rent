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

// Configuración del SDK
const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID || 'CALZGCSB3P3WEBLW3QTF5Y4WEALEVTYUYBC7KBGQ266GDINT7U4E74KW';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const STELLAR_NETWORK = (process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet') as
  | 'testnet'
  | 'mainnet';

// Claves de localStorage
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

  // Refs para acceder al estado actual en callbacks
  const sdkRef = useRef<StellarSocialSDK | null>(null);
  const setUserRef = useRef(setUser);
  const setAccountRef = useRef(setAccount);
  const setAuthMethodRef = useRef(setAuthMethod);
  const setIsLoadingRef = useRef(setIsLoading);

  // Actualizar refs cuando cambia el estado
  useEffect(() => {
    sdkRef.current = sdk;
  }, [sdk]);

  useEffect(() => {
    setUserRef.current = setUser;
    setAccountRef.current = setAccount;
    setAuthMethodRef.current = setAuthMethod;
    setIsLoadingRef.current = setIsLoading;
  }, []);

  // Inicializar SDK
  useEffect(() => {
    const initSDK = async () => {
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
      }
    };

    initSDK();
  }, []);

  // Restaurar sesión desde localStorage
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
          console.log('✅ Session restored for:', parsedUser.name || parsedUser.publicKey);
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

  // Restore account when SDK is ready and we have a stored session
  useEffect(() => {
    const restoreAccount = async () => {
      if (!sdk || !user || account) return;

      try {
        if (authMethod === 'freighter') {
          // For Freighter, try to reconnect silently
          const { isConnected } = await import('@stellar/freighter-api');
          const result = await isConnected();

          if (result.isConnected === true) {
            const reconnectResult = await sdk.connectFreighter();
            if (reconnectResult.success && reconnectResult.account) {
              setAccount(reconnectResult.account as StellarSocialAccount);
              console.log('✅ Freighter account restored');
            }
          } else {
            // Freighter not available, clear session
            console.warn('Freighter not available, clearing session');
            clearStorage();
            setUser(null);
            setAuthMethod(null);
          }
        }
        // For Google, user must re-authenticate to get account
        // The UI should prompt for re-auth when account is needed
      } catch (error) {
        console.error('Error restoring account:', error);
      }
    };

    restoreAccount();
  }, [sdk, user, authMethod, account]);

  // Configurar Google OAuth cuando el SDK esté listo
  useEffect(() => {
    if (!sdk || !GOOGLE_CLIENT_ID) return;

    const setupGoogleOAuth = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        // Asignar callback global
        window.handleGoogleCredential = handleGoogleAuthComplete;

        // Inicializar Google Identity Services
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

        console.log('✅ Google OAuth initialized');
      } else {
        // Reintentar si el script de Google aún no ha cargado
        setTimeout(setupGoogleOAuth, 500);
      }
    };

    // Esperar a que cargue el script de Google
    setTimeout(setupGoogleOAuth, 1000);
  }, [sdk]);

  // Handler para autenticación con Google
  const handleGoogleAuthComplete = useCallback(async (credentialResponse: CredentialResponse) => {
    const currentSdk = sdkRef.current;

    if (!credentialResponse?.credential) {
      toast.error('No credential received from Google');
      return;
    }

    if (!currentSdk) {
      toast.error('SDK not initialized');
      return;
    }

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

        // Guardar en estado
        setUserRef.current(socialUser);
        setAccountRef.current(stellarAccount);
        setAuthMethodRef.current('google');

        // Persistir en localStorage
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(socialUser));
        localStorage.setItem(STORAGE_KEYS.AUTH_METHOD, 'google');

        toast.success(`Welcome ${socialUser.name || 'User'}!`, { id: toastId });
        console.log('✅ Google auth successful:', socialUser.publicKey);
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de autenticación';
      toast.error(errorMessage, { id: toastId });
      console.error('❌ Google auth failed:', error);
    } finally {
      setIsLoadingRef.current(false);
    }
  }, []);

  // Login con Google (trigger manual)
  const loginWithGoogle = useCallback(
    async (credentialResponse: CredentialResponse) => {
      await handleGoogleAuthComplete(credentialResponse);
    },
    [handleGoogleAuthComplete]
  );

  // Login con Freighter
  const loginWithFreighter = useCallback(async () => {
    if (!sdk) {
      toast.error('SDK not initialized');
      return;
    }

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

        // Guardar en estado
        setUser(socialUser);
        setAccount(stellarAccount);
        setAuthMethod('freighter');

        // Persistir en localStorage
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(socialUser));
        localStorage.setItem(STORAGE_KEYS.AUTH_METHOD, 'freighter');

        toast.success('Wallet connected!', { id: toastId });
        console.log('✅ Freighter auth successful:', socialUser.publicKey);
      } else {
        throw new Error(result.error || 'Failed to connect Freighter');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      toast.error(errorMessage, { id: toastId });
      console.error('❌ Freighter auth failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  // Logout
  const logout = useCallback(() => {
    // Limpiar estado
    setUser(null);
    setAccount(null);
    setAuthMethod(null);

    // Limpiar localStorage
    clearStorage();

    // Revocar acceso de Google si estaba autenticado con Google
    if (authMethod === 'google' && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }

    toast.success('Logged out');
    console.log('✅ Logged out');
  }, [authMethod]);

  // Obtener balance
  const getBalance = useCallback(async (): Promise<BalanceInfo[]> => {
    if (!account) {
      console.warn('No account available for balance check');
      return [];
    }

    try {
      const balances = await account.getBalance();
      return balances;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return [];
    }
  }, [account]);

  // Enviar pago
  const sendPayment = useCallback(
    async (to: string, amount: string, memo?: string): Promise<string> => {
      if (!account) {
        throw new Error('No active account');
      }

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

// Helper para limpiar storage
function clearStorage() {
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.AUTH_METHOD);
  // Limpiar claves legacy también
  localStorage.removeItem('user');
  localStorage.removeItem('authToken');
  localStorage.removeItem('authType');
}

export const useAuth = () => useContext(AuthContext);
