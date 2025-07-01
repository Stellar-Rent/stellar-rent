'use client';

import type React from 'react';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  allowedAuthTypes?: ('email' | 'wallet')[];
}

export default function ProtectedRoute({
  children,
  redirectTo = '/login',
  allowedAuthTypes = ['email', 'wallet'],
}: ProtectedRouteProps) {
  const { isAuthenticated, authType, isLoading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setIsChecking(false);

      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      if (authType && !allowedAuthTypes.includes(authType)) {
        console.log('🚫 Auth type not allowed:', authType, 'Allowed:', allowedAuthTypes);
        router.push(redirectTo);
        return;
      }
    }
  }, [isAuthenticated, authType, isLoading, router, redirectTo, allowedAuthTypes]);

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (authType && !allowedAuthTypes.includes(authType))) {
    return null;
  }

  return <>{children}</>;
}
