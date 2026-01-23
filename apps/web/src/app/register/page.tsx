'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Register page - Redirects to login
 *
 * With social login, registration and login are the same process.
 * This page exists only to maintain compatibility with existing links.
 */
export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login since register = login with social auth
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1320]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        <p className="text-gray-400">Redirecting to login...</p>
      </div>
    </div>
  );
}
