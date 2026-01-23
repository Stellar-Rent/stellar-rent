'use client';

import { useAuth } from '@/hooks/auth/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { FreighterFallback } from '~/components/auth/FreighterFallback';
import { SocialLoginButton } from '~/components/auth/SocialLoginButton';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push(redirect);
    }
  }, [isAuthenticated, isLoading, router, redirect]);

  // Success handler
  const handleSuccess = () => {
    router.push(redirect);
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1320]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
          <p className="text-gray-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Don't show login if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1320] px-4">
      <div className="w-full max-w-md">
        {/* Login card */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-xl">
          {/* Logo and title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <svg
                aria-hidden="true"
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to StellarRent</h1>
            <p className="text-gray-400">Sign in to access your account</p>
          </div>

          {/* Main button: Google */}
          <div className="space-y-4">
            <SocialLoginButton className="w-full" />

            {/* Separator */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#0B1320] text-gray-500">or connect your wallet</span>
              </div>
            </div>

            {/* Fallback: Freighter */}
            <FreighterFallback onSuccess={handleSuccess} />
          </div>

          {/* Additional info */}
          <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-300 font-medium">
                  Your Stellar wallet is created automatically
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  When you sign in with Google, a unique wallet linked to your account is generated.
                  You don't need to create or remember any private keys.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-blue-400 hover:text-blue-300">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-400 hover:text-blue-300">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
