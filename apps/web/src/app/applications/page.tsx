'use client';

import { RightSidebar } from '@/components/layout/RightSidebar';
import { FileText } from 'lucide-react';

export default function ApplicationsPage() {
  return (
    <div className="flex w-full min-h-screen">
      <main className="flex flex-1 flex-col w-full min-h-screen px-5 pr-16">
        <header className="flex items-center justify-between p-4 border-b border-gray-800">
          <h1 className="text-2xl font-semibold text-white">Applications</h1>
        </header>

        <section className="flex-1 flex items-center justify-center px-4 pb-4">
          <div className="max-w-3xl w-full text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-[#0B1D39] flex items-center justify-center border-2 border-gray-700">
                <FileText className="w-10 h-10 text-primary" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white">
              Application Management
            </h2>

            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Here you'll see application and request lists soon. This feature will allow you to
              manage guest applications and host booking requests all in one place.
            </p>

            <div className="bg-secondary rounded-xl p-6 mt-8 border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-4">Coming Soon</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <p className="text-gray-300">View and manage booking applications</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <p className="text-gray-300">Track application status in real-time</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                  <p className="text-gray-300">Respond to guest requests efficiently</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <RightSidebar />
    </div>
  );
}
