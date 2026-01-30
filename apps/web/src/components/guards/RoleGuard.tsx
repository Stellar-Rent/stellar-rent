'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { useAuth } from '~/hooks/auth/use-auth';
import { useUserRole } from '~/hooks/useUserRole';
import type { UserRole } from '~/types/roles';

interface RoleGuardProps {
  children: ReactNode;
  requiredRole: UserRole;
  fallbackPath?: string;
}

export function RoleGuard({
  children,
  requiredRole,
  fallbackPath = '/become-host',
}: RoleGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { role, canAccessHostDashboard, isLoading: roleLoading } = useUserRole();

  const isLoading = authLoading || roleLoading;

  // Use main's improved access logic
  const hasAccess = useMemo(() => {
    if (requiredRole === 'guest') return true;
    if (!isAuthenticated) return false;
    if (requiredRole === 'host') return canAccessHostDashboard;
    return role === 'dual';
  }, [canAccessHostDashboard, isAuthenticated, requiredRole, role]);

  // Keep main's auto-redirect logic
  useEffect(() => {
    if (!isLoading && !hasAccess) {
      router.replace(fallbackPath);
    }
  }, [fallbackPath, hasAccess, isLoading, router]);

  // Use error-handling's better Loading Spinner UI
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0B1D39]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Use error-handling's Premium Card UI for "Access Denied"
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-[#0B1D39]">
        <div className="text-center max-w-md bg-white dark:bg-[#0B1D39]/90 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Host Access Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
             You need a verified host profile with properties to access this page. Join our community of hosts and start earning.
          </p>
          <button
            type="button"
            onClick={() => router.push(fallbackPath)}
            className="w-full bg-[#0B1D39] dark:bg-blue-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-colors font-semibold"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}