// apps/web/src/hooks/auth/RoleGuard.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUserRole } from '../useUserRole';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: 'guest' | 'host';
}

export default function RoleGuard({ children, requiredRole }: RoleGuardProps) {
  const { role, canAccessHostDashboard, isLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    // Redirect unauthenticated users to main dashboard
    if (!role) {
      router.replace('/dashboard');
      return;
    }

    if (requiredRole === 'host') {
      // TODO: Add check for hasProperties when available in useUserRole
      if (!(role === 'host' || role === 'dual') || !canAccessHostDashboard) {
        router.replace('/dashboard');
      }
    } else if (requiredRole === 'guest') {
      // Allow: guest, dual, or host without host-dashboard access
      if (role !== 'guest' && role !== 'dual' && !(role === 'host' && !canAccessHostDashboard)) {
        router.replace('/dashboard');
      }
    }
  }, [role, canAccessHostDashboard, isLoading, router, requiredRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
