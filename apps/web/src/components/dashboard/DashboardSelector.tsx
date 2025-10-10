// apps/web/src/components/dashboard/DashboardSelector.tsx
'use client';
import { Home, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function DashboardSelector() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNavigation = (
    e: React.MouseEvent<HTMLAnchorElement>,
    dashboard: string,
    href: string
  ) => {
    e.preventDefault();
    setLoading(dashboard);

    // Fallback timeout to clear loading state
    timeoutRef.current = setTimeout(() => {
      setLoading(null);
    }, 8000);

    router.push(href).finally(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setLoading(null);
    });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          Choose Your Dashboard
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/dashboard/tenant-dashboard"
            onClick={(e) => handleNavigation(e, 'guest', '/dashboard/tenant-dashboard')}
            className="group relative block focus:outline-none"
          >
            <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-blue-500">
              <User className="w-12 h-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                Guest Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                View your bookings, trips, and reservations
              </p>
              {loading === 'guest' && (
                <div
                  className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-50 flex items-center justify-center rounded-xl"
                  // biome-ignore lint/a11y/useSemanticElements: Using a div with role='status' for the loading overlay.
                  role="status"
                  aria-live="polite"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="sr-only">Loading Guest Dashboard...</span>
                </div>
              )}
            </div>
          </Link>

          <Link
            href="/dashboard/host-dashboard"
            onClick={(e) => handleNavigation(e, 'host', '/dashboard/host-dashboard')}
            className="group relative block focus:outline-none"
          >
            <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-green-500">
              <Home className="w-12 h-12 text-green-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                Host Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Manage properties, bookings, and earnings
              </p>
              {loading === 'host' && (
                <div
                  className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-50 flex items-center justify-center rounded-xl"
                  // biome-ignore lint/a11y/useSemanticElements: Using a div with role='status' for the loading overlay.
                  role="status"
                  aria-live="polite"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  <span className="sr-only">Loading Host Dashboard...</span>
                </div>
              )}
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
