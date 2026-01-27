'use client';

import type React from 'react';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  allowedAuthTypes?: ('google' | 'freighter')[];
}

export default function ProtectedRoute({
  children,
  redirectTo = '/login',
  allowedAuthTypes = ['google', 'freighter'],
}: ProtectedRouteProps) {
  const { isAuthenticated, authMethod, isLoading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setIsChecking(false);

      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      if (authMethod && !allowedAuthTypes.includes(authMethod)) {
        console.log('Auth method not allowed:', authMethod, 'Allowed:', allowedAuthTypes);
        router.push(redirectTo);
        return;
      }
    }
  }, [isAuthenticated, authMethod, isLoading, router, redirectTo, allowedAuthTypes]);

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1320]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (authMethod && !allowedAuthTypes.includes(authMethod))) {
    return null;
  }

  return <>{children}</>;
}
