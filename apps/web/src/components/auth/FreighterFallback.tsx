'use client';

import { isConnected } from '@stellar/freighter-api';
import { useEffect, useState } from 'react';
import { useAuth } from '~/hooks/auth/use-auth';

interface FreighterFallbackProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

type ConnectionState = 'idle' | 'connecting' | 'success' | 'error';

const FREIGHTER_INSTALL_URL = 'https://www.freighter.app/';

export function FreighterFallback({ onSuccess, onError, className }: FreighterFallbackProps) {
  const { loginWithFreighter, isLoading } = useAuth();
  const [state, setState] = useState<ConnectionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFreighterInstalled, setIsFreighterInstalled] = useState<boolean | null>(null);

  // Check for Freighter using the official API
  useEffect(() => {
    const checkFreighter = async () => {
      try {
        const connected = await isConnected();
        // isConnected returns true if extension is installed (even if not connected)
        setIsFreighterInstalled(
          connected.isConnected !== undefined ? true : (connected as unknown as boolean)
        );
      } catch {
        // If the API throws, Freighter is likely not installed
        setIsFreighterInstalled(false);
      }
    };

    checkFreighter();
  }, []);

  const handleConnect = async () => {
    if (!isFreighterInstalled) {
      setState('error');
      setErrorMessage('Freighter is not installed');
      return;
    }

    setState('connecting');
    setErrorMessage(null);

    try {
      await loginWithFreighter();
      setState('success');
      onSuccess?.();
    } catch (error) {
      setState('error');
      const message = error instanceof Error ? error.message : 'Connection failed';
      setErrorMessage(message);
      onError?.(message);
    }
  };

  const isConnecting = state === 'connecting' || isLoading;

  // Still checking for Freighter
  if (isFreighterInstalled === null) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-transparent text-white font-medium rounded-lg border border-white/20">
          <span className="text-sm text-gray-400">Checking for wallet...</span>
        </div>
      </div>
    );
  }

  // If Freighter is not installed, show install link
  if (!isFreighterInstalled) {
    return (
      <div className={`space-y-2 ${className}`}>
        <a
          href={FREIGHTER_INSTALL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-transparent hover:bg-white/5 text-white font-medium rounded-lg border border-white/20 transition-colors"
        >
          <FreighterIcon className="w-5 h-5" />
          Install Freighter Wallet
          <ExternalLinkIcon className="w-4 h-4 opacity-50" />
        </a>
        <p className="text-xs text-gray-400 text-center">For users with existing Stellar wallet</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        type="button"
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-transparent hover:bg-white/5 text-white font-medium rounded-lg border border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <svg aria-hidden="true" className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Connecting...
          </>
        ) : (
          <>
            <FreighterIcon className="w-5 h-5" />
            Connect with Freighter
          </>
        )}
      </button>

      {state === 'error' && errorMessage && (
        <p className="text-sm text-red-400 text-center">{errorMessage}</p>
      )}

      {state === 'success' && (
        <p className="text-sm text-green-400 text-center">Wallet connected</p>
      )}
    </div>
  );
}

// Freighter icon (simplified)
function FreighterIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

// External link icon
function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15,3 21,3 21,9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
