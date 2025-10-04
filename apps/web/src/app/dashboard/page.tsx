// apps/web/src/app/dashboard/page.tsx
'use client';

import { useUserRole } from '~/hooks/useUserRole';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardSelector } from '~/components/dashboard/DashboardSelector';

export default function DashboardPage() {
  const { role, canAccessHostDashboard } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (role === 'host' && canAccessHostDashboard) {
      router.replace('/dashboard/host');
    } else if (role === 'guest') {
      router.replace('/dashboard/guest');
    }
  }, [role, canAccessHostDashboard, router]);

  if (role === 'dual') {
    return <DashboardSelector />;
  }

  return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}