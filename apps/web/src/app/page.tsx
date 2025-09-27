'use client';

import { SearchBar } from '@/components/features/search/SearchBar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { PropertyGrid } from '@/components/search/PropertyGrid';
import { House } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Simulate retry
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Simulate api call
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="flex w-full min-h-screen">
      <main className="flex flex-1 flex-col w-full min-h-screen px-5 pr-16">
        <header className="flex items-center justify-between p-4 border-b border-gray-800">
          <Image src="/logo.png" alt="StellaRent" width={100} height={100} />
        </header>

        <section className="p-4">
          <SearchBar />
        </section>

        <section className="flex-1 px-4 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-white text-sm bg-secondary p-2 px-4 rounded-full flex items-center gap-2">
              <House className="w-4 h-4" />
              Showing 23 properties
            </span>
          </div>

          <PropertyGrid isLoading={isLoading} error={error} onRetry={handleRetry} />
        </section>
      </main>

      <RightSidebar />
    </div>
  );
}
