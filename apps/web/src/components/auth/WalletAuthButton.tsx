'use client';

import { CheckCircle, Loader2, ShieldCheck, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAuth } from '~/hooks/auth/use-auth';
import { useWallet } from '../../hooks/useWallet';
import { getFreighterInstallUrl } from '../../lib/freighter-utils';

interface WalletAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

type AuthState = 'disconnected' | 'connecting' | 'connected' | 'authenticating' | 'auto-checking';

const hasUsedWalletAuth = (publicKey: string | null) => {
  if (typeof window === 'undefined') return false;
  const authType = localStorage.getItem('authType');
  const lastWalletKey = localStorage.getItem('lastWalletPublicKey');
  return authType === 'wallet' && lastWalletKey === publicKey;
};

export default function WalletAuthButton({
  onSuccess,
  onError,
  className = '',
}: WalletAuthButtonProps) {
  const [authState, setAuthState] = useState<AuthState>('disconnected');
  const { loginWithWallet, isLoading } = useAuth();
  const {
    isConnected,
    publicKey,
    isInstalled,
    isLoading: walletLoading,
    error: walletError,
    connect,
  } = useWallet();

  useEffect(() => {
    const handleAutoAuth = async () => {
      if (isConnected && publicKey && !isLoading && authState === 'connected') {
        if (hasUsedWalletAuth(publicKey)) {
          setAuthState('authenticating');
          try {
            await loginWithWallet();
            localStorage.setItem('lastWalletPublicKey', publicKey);
            onSuccess?.();
          } catch (error) {
            console.error('Auto-auth failed:', error);
            const errorMessage = getErrorMessage(error);
            onError?.(errorMessage);
            setAuthState('connected');
          }
        }
      }
    };

    handleAutoAuth();
  }, [isConnected, publicKey, isLoading, authState, loginWithWallet, onSuccess, onError]);

  useEffect(() => {
    if (walletLoading) {
      setAuthState('auto-checking');
    } else if (!isInstalled) {
      setAuthState('disconnected');
    } else if (!isConnected || !publicKey) {
      setAuthState('disconnected');
    } else if (isConnected && publicKey && !isLoading) {
      if (hasUsedWalletAuth(publicKey)) {
        setAuthState('connected');
      } else {
        setAuthState('connected');
      }
    }
  }, [walletLoading, isInstalled, isConnected, publicKey, isLoading]);

  const handleConnect = async () => {
    setAuthState('connecting');
    try {
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
      const errorMessage = getErrorMessage(error);
      onError?.(errorMessage);
      setAuthState('disconnected');
    }
  };

  const handleAuthenticate = async () => {
    setAuthState('authenticating');
    try {
      await loginWithWallet();
      if (publicKey) {
        localStorage.setItem('lastWalletPublicKey', publicKey);
      }
      onSuccess?.();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      onError?.(errorMessage);
      setAuthState('connected');
    }
  };

  const handleInstallFreighter = () => {
    window.open(getFreighterInstallUrl(), '_blank');
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      if (error.message.includes('Freighter')) {
        return 'Freighter wallet extension not found. Please install Freighter to continue.';
      }
      if (error.message.includes('User rejected') || error.message.includes('rejected')) {
        return 'Wallet connection was rejected. Please try again.';
      }
      if (error.message.includes('Invalid or expired challenge')) {
        return 'Authentication challenge expired. Please try again.';
      }
      if (error.message.includes('Invalid signature')) {
        return 'Signature verification failed. Please try again.';
      }
      return error.message;
    }
    return 'An unexpected error occurred during wallet authentication.';
  };

  if (!walletLoading && !isInstalled) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleInstallFreighter}
          className={`
            flex w-full items-center justify-center rounded-md border-2 border-dashed 
            border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 
            transition-all duration-300 hover:border-gray-400 hover:bg-gray-100 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-700
            ${className}
          `}
        >
          <ShieldCheck className="mr-2 h-5 w-5" />
          Install Freighter Wallet
        </button>
        <p className="text-xs text-gray-500 text-center dark:text-gray-400">
          Freighter is required to connect your Stellar wallet
        </p>
      </div>
    );
  }

  if (walletError && !walletLoading) {
    return (
      <div className="space-y-3">
        <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/50">
          <p className="text-sm text-red-700 dark:text-red-200">{walletError}</p>
        </div>
        <button
          type="button"
          onClick={handleInstallFreighter}
          className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Install or Enable Freighter
        </button>
      </div>
    );
  }

  const getButtonContent = () => {
    switch (authState) {
      case 'auto-checking':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Detecting Wallet...
          </>
        );
      case 'connecting':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting Wallet...
          </>
        );
      case 'connected':
        return (
          <>
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            {publicKey ? `${publicKey.slice(0, 8)}... • Click to Sign In` : 'Click to Sign In'}
          </>
        );
      case 'authenticating':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {hasUsedWalletAuth(publicKey) ? 'Signing you in...' : 'Please approve in wallet...'}
          </>
        );
      default:
        return (
          <>
            <Wallet className="mr-2 h-5 w-5" />
            Connect Stellar Wallet
          </>
        );
    }
  };

  const handleClick = () => {
    switch (authState) {
      case 'disconnected':
        handleConnect();
        break;
      case 'connected':
        handleAuthenticate();
        break;
      default:
        break;
    }
  };

  const isDisabled =
    authState === 'auto-checking' || authState === 'connecting' || authState === 'authenticating';

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={`
          flex w-full items-center justify-center rounded-md border border-gray-300 
          bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm 
          transition-all duration-300 hover:bg-gray-50 focus:outline-none 
          focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
          disabled:cursor-not-allowed disabled:opacity-50
          dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700
          ${authState === 'connected' ? 'border-green-300 bg-green-50 hover:bg-green-100 dark:border-green-600 dark:bg-green-900/20' : ''}
          ${className}
        `}
      >
        {getButtonContent()}
      </button>
      {authState === 'connected' && !hasUsedWalletAuth(publicKey) && (
        <p className="text-xs text-gray-500 text-center dark:text-gray-400">
          Click the button above to sign the authentication message
        </p>
      )}
      {authState === 'connected' && hasUsedWalletAuth(publicKey) && (
        <p className="text-xs text-green-600 text-center dark:text-green-400">
          Welcome back! You'll be signed in automatically
        </p>
      )}
    </div>
  );
}
