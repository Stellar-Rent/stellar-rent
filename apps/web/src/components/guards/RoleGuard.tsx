'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUserRole } from '~/hooks/useUserRole';
import type { UserRole } from '~/types/roles';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  fallbackPath?: string;
}

export function RoleGuard({
  children,
  requiredRole,
  fallbackPath = '/become-host',
}: RoleGuardProps) {
  const roleInfo = useUserRole();
  const { canAccessHostDashboard, isLoading } = roleInfo;
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for role data to load
    if (!isLoading) {
      setIsChecking(false);
    }
  }, [isLoading]);

  // Show loading state while checking authentication
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show specific UI if user needs to become a host
  if (requiredRole === 'host' && !canAccessHostDashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Host Access Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to become a host to access this page. Join our community of hosts and start
            earning.
          </p>
          <button
            type="button"
            onClick={() => router.push(fallbackPath)}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Become a Host
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
