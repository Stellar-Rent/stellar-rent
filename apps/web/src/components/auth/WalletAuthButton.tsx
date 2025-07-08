'use client';

import { CheckCircle, Loader2, ShieldCheck, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '~/hooks/auth/use-auth';
import { useWallet } from '~/hooks/useWallet';
import { getFreighterInstallUrl } from '../../lib/freighter-utils';
import NetworkStatus from '../NetworkStatus';

interface WalletAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

type AuthState = 'idle' | 'authenticating' | 'success' | 'error';

export default function WalletAuthButton({
  onSuccess,
  onError,
  className = '',
}: WalletAuthButtonProps) {
  const [authState, setAuthState] = useState<AuthState>('idle');
  const { loginWithWallet, isLoading } = useAuth();
  const {
    isInstalled,
    isConnected,
    network,
    isLoading: walletLoading,
    error: walletError,
  } = useWallet();

  const handleAuthenticate = async () => {
    setAuthState('authenticating');
    try {
      await loginWithWallet();
      setAuthState('success');
      onSuccess?.();
    } catch (error) {
      console.error('Authentication failed:', error);
      const errorMessage = getErrorMessage(error);
      onError?.(errorMessage);
      setAuthState('error');

      // Reset to idle after showing error briefly
      setTimeout(() => setAuthState('idle'), 3000);
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
      if (error.message.includes('network') || error.message.includes('Network')) {
        return 'Network mismatch detected. Please ensure your wallet is on the correct network.';
      }
      return error.message;
    }
    return 'An unexpected error occurred during wallet authentication.';
  };

  // Show install button if Freighter is not installed
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

  // Show error state if wallet has errors
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
      case 'authenticating':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please approve in wallet...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            Signed In Successfully!
          </>
        );
      case 'error':
        return (
          <>
            <Wallet className="mr-2 h-5 w-5" />
            Try Again
          </>
        );
      default:
        return (
          <>
            <Wallet className="mr-2 h-5 w-5" />
            Connect & Sign In
          </>
        );
    }
  };

  const isDisabled =
    authState === 'authenticating' || isLoading || walletLoading || authState === 'success';

  const getButtonStyles = () => {
    const baseStyles = `
      flex w-full items-center justify-center rounded-md border px-4 py-2 
      text-sm font-medium shadow-sm transition-all duration-300 
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-50
    `;

    switch (authState) {
      case 'success':
        return `${baseStyles} border-green-300 bg-green-50 text-green-700 hover:bg-green-100 
                dark:border-green-600 dark:bg-green-900/20 dark:text-green-400`;
      case 'error':
        return `${baseStyles} border-red-300 bg-red-50 text-red-700 hover:bg-red-100
                dark:border-red-600 dark:bg-red-900/20 dark:text-red-400`;
      default:
        return `${baseStyles} border-gray-300 bg-white text-gray-700 hover:bg-gray-50
                dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700`;
    }
  };

  return (
    <div className="space-y-3">
      {/* Network Status */}
      {isConnected && (
        <div className="flex justify-center">
          <NetworkStatus />
        </div>
      )}

      {/* Auth Button */}
      <button
        type="button"
        onClick={handleAuthenticate}
        disabled={isDisabled}
        className={`${getButtonStyles()} ${className}`}
      >
        {getButtonContent()}
      </button>

      {/* Helper Text */}
      {authState === 'authenticating' && (
        <p className="text-xs text-gray-500 text-center dark:text-gray-400">
          You may see 1-2 wallet popups for connection and signing
        </p>
      )}

      {authState === 'idle' && isConnected && (
        <p className="text-xs text-gray-500 text-center dark:text-gray-400">
          Ready to authenticate with {network?.toLowerCase() || 'testnet'} network
        </p>
      )}

      {authState === 'idle' && !isConnected && (
        <p className="text-xs text-gray-500 text-center dark:text-gray-400">
          One-click authentication with your Stellar wallet
        </p>
      )}
    </div>
  );
}
