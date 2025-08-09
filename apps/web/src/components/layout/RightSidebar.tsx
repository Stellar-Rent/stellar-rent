'use client';

import { User } from 'lucide-react';
import Image from 'next/image';
import { IconContainer } from '../ui/icon-container';

export const RightSidebar = () => {
  return (
    <div className="fixed right-0 top-0 h-full w-16 bg-secondary flex flex-col items-center py-4 z-40 rounded-s-3xl">
      {/* Navigation Icons */}
      <div className="flex flex-col items-center space-y-6">
        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Image src="/icons/menu.webp" alt="Menu" width={40} height={40} className="p-2" />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <IconContainer
            icon={
              <Image src="/icons/search.webp" alt="Search" width={40} height={40} className="p-2" />
            }
          />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Image src="/icons/heart.webp" alt="Heart" width={40} height={40} className="p-2" />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Image src="/icons/send.webp" alt="Send" width={40} height={40} className="p-2" />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Image src="/icons/settings.webp" alt="Settings" width={40} height={40} className="p-2" />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Image src="/icons/lock.webp" alt="Lock" width={40} height={40} className="p-2" />
        </button>

        <button type="button" className="text-primary transition-colors duration-200 p-2">
          <Image src="/icons/message.webp" alt="Message" width={40} height={40} className="p-2" />
        </button>
      </div>

      <div className="mt-auto">
        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  );
};
