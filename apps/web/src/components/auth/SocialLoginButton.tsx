'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SocialLoginButtonProps {
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

type ButtonState = 'loading' | 'ready' | 'error';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function SocialLoginButton({ onError, disabled, className }: SocialLoginButtonProps) {
  const [state, setState] = useState<ButtonState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const renderAttempts = useRef(0);
  const hasRendered = useRef(false);
  const maxAttempts = 20; // 10 seconds max wait

  const handleError = useCallback(
    (message: string) => {
      setState('error');
      setErrorMessage(message);
      onError?.(message);
    },
    [onError]
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      handleError('Google Client ID not configured');
      return;
    }

    const renderGoogleButton = () => {
      // Wait for the ref to be available
      if (!buttonContainerRef.current) {
        renderAttempts.current += 1;
        if (renderAttempts.current < maxAttempts) {
          setTimeout(renderGoogleButton, 100);
        } else {
          handleError('Button container not available');
        }
        return;
      }

      // Check if Google Identity Services is available
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        // Prevent duplicate renders
        if (hasRendered.current) return;

        try {
          // Clear container
          buttonContainerRef.current.innerHTML = '';

          // IMPORTANT: Initialize BEFORE renderButton
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: unknown) => {
              // Use global handler set by AuthProvider
              if (window.handleGoogleCredential) {
                window.handleGoogleCredential(
                  response as Parameters<typeof window.handleGoogleCredential>[0]
                );
              }
            },
            auto_select: false,
            cancel_on_tap_outside: false,
          });

          // Render official Google button
          window.google.accounts.id.renderButton(buttonContainerRef.current, {
            type: 'standard',
            shape: 'rectangular',
            theme: 'filled_blue',
            text: 'signin_with',
            size: 'large',
            width: 280,
          });

          hasRendered.current = true;
          setState('ready');
          console.log('✅ Google Sign-In button rendered');
        } catch (error) {
          console.error('Error rendering Google button:', error);
          handleError('Failed to load Google button');
        }
      } else {
        // Retry if script hasn't loaded yet
        renderAttempts.current += 1;

        if (renderAttempts.current < maxAttempts) {
          setTimeout(renderGoogleButton, 500);
        } else {
          handleError('Google Sign-In unavailable');
        }
      }
    };

    // Start trying to render immediately
    renderGoogleButton();
  }, [handleError]);

  // Fallback: manual trigger for One Tap
  const handleManualTrigger = () => {
    if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
      // Ensure initialized before prompting
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: unknown) => {
          if (window.handleGoogleCredential) {
            window.handleGoogleCredential(
              response as Parameters<typeof window.handleGoogleCredential>[0]
            );
          }
        },
        auto_select: false,
      });

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason();
          console.warn('Google One Tap not displayed:', reason);

          if (reason === 'opt_out_or_no_session') {
            handleError('Please sign in to Google first');
          } else if (reason === 'suppressed_by_user') {
            handleError('One Tap temporarily disabled');
          }
        }
      });
    } else {
      handleError('Google Identity Services not loaded');
    }
  };

  if (state === 'error') {
    return (
      <div className={`space-y-3 ${className}`}>
        <button
          type="button"
          onClick={handleManualTrigger}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>
        {errorMessage && <p className="text-sm text-amber-400 text-center">{errorMessage}</p>}
      </div>
    );
  }

  // Always render the container - show loading overlay when not ready
  return (
    <div className={className}>
      <div className="relative">
        {/* Google button container - always rendered so ref is available */}
        <div
          ref={buttonContainerRef}
          className={`flex justify-center min-h-[44px] ${disabled ? 'opacity-50 pointer-events-none' : ''} ${state === 'loading' ? 'invisible' : 'visible'}`}
        />

        {/* Loading overlay */}
        {state === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-400">
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
              <span>Loading Google Sign-In...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
