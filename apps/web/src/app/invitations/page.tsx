'use client';

import { RightSidebar } from '@/components/layout/RightSidebar';
import { Search } from 'lucide-react';

const InvitationsPage = () => {
  return (
    <div className="flex w-full min-h-screen">
      <main className="flex flex-1 flex-col w-full min-h-screen px-5 pr-16">
        <header className="flex items-center justify-between p-4 border-b border-gray-800">
          <h1 className="text-2xl font-semibold text-white">My invitations</h1>
        </header>

        <section className="flex-1 px-4 pb-4">
          <div className="bg-secondary rounded-xl p-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-full max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search an invitation..."
                  className="w-full pl-9 pr-3 py-2 rounded-md bg-background text-white placeholder:text-gray-400 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/60"
                  disabled
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-400">Rows per page</div>
                <div className="text-sm text-white">10</div>
              </div>
            </div>

            <div className="w-full overflow-hidden rounded-lg border border-gray-800">
              <div className="grid grid-cols-7 text-xs font-medium text-gray-300 uppercase tracking-wide bg-[#0B1D39]">
                <div className="py-3 px-4">Property</div>
                <div className="py-3 px-4">Owner</div>
                <div className="py-3 px-4">Check-in</div>
                <div className="py-3 px-4">Check-out</div>
                <div className="py-3 px-4">Created</div>
                <div className="py-3 px-4">Status</div>
                <div className="py-3 px-4">Invitation</div>
              </div>

              <div className="py-16 text-center text-gray-300 bg-[#071429]">
                No invitations sent yet
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
              <div>Total: 0 invitations</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded-md bg-[#0B1D39] border border-gray-800 text-gray-300"
                  disabled
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded-md bg-[#0B1D39] border border-gray-800 text-gray-300"
                  disabled
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <RightSidebar />
    </div>
  );
};

export default InvitationsPage;
