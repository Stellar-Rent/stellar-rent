"use client"

import { useAuth } from '@/hooks/auth/use-auth';
import { useRouter } from 'next/navigation';
import { use, useEffect } from 'react';

export default function BecomeHostPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect verified hosts to host dashboard
  useEffect(() => {
    if (!isLoading ) {
      router.push('/dashboard/host-dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Become a Host
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Share your property on StellarRent and start earning today
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
          <p className="text-yellow-800 dark:text-yellow-200 font-medium">
            🚧 Host Onboarding in Progress
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
            Our team is building a seamless host onboarding experience. The full verification and property listing process will launch soon in Phase 2.
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
              ✓ Verify Your Identity
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Complete a secure identity verification process (coming soon)
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
              ✓ Set Up Payments
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure your payment method to receive earnings (coming soon)
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
              ✓ List Your Property
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add your property details and start hosting (coming soon)
            </p>
          </div>
        </div>

        <div className="mt-8">
          <a
            href="/tenant-dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
