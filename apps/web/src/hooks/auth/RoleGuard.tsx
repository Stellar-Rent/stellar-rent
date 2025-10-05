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

    if (requiredRole === 'host') {
      if (!(role === 'host' || role === 'dual') || !canAccessHostDashboard) {
        router.replace('/dashboard');
      }
    } else if (requiredRole === 'guest') {
      if (role !== 'guest' && role !== 'dual' && !(role === 'host' && !canAccessHostDashboard)) {
        router.replace('/dashboard');
      }
    }
  }, [role, canAccessHostDashboard, isLoading, router, requiredRole]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return <>{children}</>;
}
