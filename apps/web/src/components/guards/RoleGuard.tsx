'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUserRole } from '~/hooks/useUserRole';
import type { UserRole } from '~/types/roles';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  fallbackPath?: string;
}

export function RoleGuard({ children, requiredRole, fallbackPath = '/dashboard' }: RoleGuardProps) {
  const { role, canAccessHostDashboard, isLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    // Redirect unauthenticated users to main dashboard
    if (!role) {
      router.replace(fallbackPath);
      return;
    }

    if (requiredRole === 'host') {
      // Host role requires: (role === 'host' || role === 'dual') AND canAccessHostDashboard
      if (!(role === 'host' || role === 'dual') || !canAccessHostDashboard) {
        router.replace(fallbackPath);
      }
    } else if (requiredRole === 'guest') {
      // Guest role allows: guest, dual, or host without host-dashboard access
      if (role !== 'guest' && role !== 'dual' && !(role === 'host' && !canAccessHostDashboard)) {
        router.replace(fallbackPath);
      }
    }
  }, [role, canAccessHostDashboard, isLoading, router, requiredRole, fallbackPath]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized UI if user doesn't have required access
  if (
    requiredRole === 'host' &&
    (!(role === 'host' || role === 'dual') || !canAccessHostDashboard)
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Host Access Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to become a host to access this page.
          </p>
          <button
            type="button"
            onClick={() => router.push('/become-host')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Become a Host
          </button>
        </div>
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
}

