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

export function RoleGuard({
  children,
  requiredRole,
  fallbackPath = '/become-host',
}: RoleGuardProps) {
  const { canAccessHostDashboard } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (requiredRole === 'host' && !canAccessHostDashboard) {
      router.push(fallbackPath);
    }
  }, [requiredRole, canAccessHostDashboard, router, fallbackPath]);

  if (requiredRole === 'host' && !canAccessHostDashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Host Access Required</h2>
          <p className="text-gray-600 mb-6">You need to become a host to access this page.</p>
          <button
            type="button"
            onClick={() => router.push('/become-host')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Become a Host
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
