'use client';

import { User } from 'lucide-react';
import Image from 'next/image';
import { IconContainer } from '../ui/icon-container';

export const RightSidebar = () => {
  return (
    <div className="fixed right-0 top-0 h-full w-20 md:w-24 bg-secondary/95 shadow-xl backdrop-blur flex flex-col items-center py-6 z-40 rounded-s-3xl">
      {/* Navigation Icons */}
      <div className="flex flex-col items-center space-y-8">
        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Image src="/icons/menu.webp" alt="Menu" width={36} height={36} className="p-2" />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <IconContainer
            icon={
              <Image src="/icons/search.webp" alt="Search" width={36} height={36} className="p-2" />
            }
          />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Image src="/icons/heart.webp" alt="Heart" width={36} height={36} className="p-2" />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Image src="/icons/send.webp" alt="Send" width={36} height={36} className="p-2" />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Image src="/icons/settings.webp" alt="Settings" width={36} height={36} className="p-2" />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Image src="/icons/lock.webp" alt="Lock" width={36} height={36} className="p-2" />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Image src="/icons/message.webp" alt="Message" width={36} height={36} className="p-2" />
        </button>
      </div>

      <div className="mt-auto pb-4">
        <div className="w-12 h-12 rounded-full bg-gray-600/60 flex items-center justify-center">
          <User className="w-7 h-7 text-primary" />
        </div>
      </div>
    </div>
  );
};
