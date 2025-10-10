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

      // Redirect if user doesn't have required access
      if (requiredRole === 'host' && !canAccessHostDashboard) {
        router.push(fallbackPath);
      }
    }
  }, [requiredRole, canAccessHostDashboard, isLoading, router, fallbackPath]);

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

  // Return null during redirect to prevent flash of unauthorized content
  if (requiredRole === 'host' && !canAccessHostDashboard) {
    return null;
  }

  return <>{children}</>;
}
