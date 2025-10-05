// apps/web/src/app/dashboard/page.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardSelector } from '~/components/dashboard/DashboardSelector';
import { useAuth } from '~/hooks/auth/use-auth';
import { useUserRole } from '~/hooks/useUserRole';

export default function DashboardPage() {
  const { role, canAccessHostDashboard, isLoading } = useUserRole();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading || isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (role === 'host' && canAccessHostDashboard) {
      router.replace('/dashboard/host-dashboard');
    } else if (role === 'guest') {
      router.replace('/dashboard/tenant-dashboard');
    }
  }, [role, canAccessHostDashboard, router, isLoading, isAuthenticated, isAuthLoading]);

  if (isLoading || isAuthLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (role === 'host' && !canAccessHostDashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome, Host!</h1>
        <p className="mb-4">
          You don't have any properties yet. Please create a property to access the host dashboard.
        </p>
        <Link
          href="/add-property"
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Create Property
        </Link>
      </div>
    );
  }

  if (role === 'dual') {
    return <DashboardSelector />;
  }

  return null;
}
