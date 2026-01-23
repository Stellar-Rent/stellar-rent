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

  const hasAccess = useMemo(() => {
    if (requiredRole === 'guest') return true;
    if (!isAuthenticated) return false;
    if (requiredRole === 'host') return canAccessHostDashboard;
    return role === 'dual';
  }, [canAccessHostDashboard, isAuthenticated, requiredRole, role]);

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      router.replace(fallbackPath);
    }
  }, [fallbackPath, hasAccess, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-sm text-gray-400">
        Checking access...
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center text-gray-200">
          <h2 className="text-2xl font-semibold text-white">Host Access Required</h2>
          <p className="mt-3 text-sm text-gray-400">
            You need a verified host profile with properties to access this page.
          </p>
          <button
            type="button"
            onClick={() => router.push(fallbackPath)}
            className="mt-6 rounded-lg bg-[#0B1D39] px-5 py-2 text-sm font-medium text-white"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

