import { SearchBar } from '@/components/features/search/SearchBar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { PropertyGrid } from '@/components/search/PropertyGrid';
import { House } from 'lucide-react';
import Image from 'next/image';
import { Suspense } from 'react';

export default function Home() {
  return (
    <div className="flex w-full min-h-screen">
      <main className="flex flex-1 flex-col w-full min-h-screen px-5 pr-16">
        <header className="flex items-center justify-between p-4 border-b border-gray-800"></header>

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

          <Suspense
            fallback={<div className="py-16 text-center text-white">Loading properties...</div>}
          >
            <PropertyGrid />
          </Suspense>
        </section>
      </main>

      <RightSidebar />
    </div>
  );
}
