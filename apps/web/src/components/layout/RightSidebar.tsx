'use client';

import { User } from 'lucide-react';
import Image from 'next/image';
import { IconContainer } from '../ui/icon-container';

type SidebarItemProps = {
  src: string;
  alt: string;
  label: string;
  size?: number;
  withContainer?: boolean;
};

const SidebarItem = ({ src, alt, label, size = 24, withContainer = false }: SidebarItemProps) => (
  <div className="relative group">
    <button
      type="button"
      aria-label={label}
      className="text-primary transition-colors duration-200 p-1"
    >
      {withContainer ? (
        <IconContainer
          size="sm"
          icon={<Image src={src} alt={alt} width={size} height={size} className="p-0.5" />}
        />
      ) : (
        <Image src={src} alt={alt} width={size} height={size} className="p-0.5" />
      )}
    </button>
    <span className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1 rounded-full bg-primary/90 text-black text-xs font-medium opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all whitespace-nowrap shadow">
      {label}
    </span>
  </div>
);

export const RightSidebar = () => {
  return (
    <div className="fixed right-0 top-0 h-full w-12 bg-secondary flex flex-col items-center py-3 z-40 rounded-s-3xl">
      {/* Navigation Icons */}
      <div className="flex flex-col items-center space-y-3">
        <SidebarItem src="/icons/menu.webp" alt="Menu" label="Menu" />
        <SidebarItem
          src="/icons/search.webp"
          alt="Find a Property"
          label="Find a Property"
          withContainer
        />
        <SidebarItem src="/icons/lock.webp" alt="My Calendar" label="My Calendar" />
        <SidebarItem src="/icons/message.webp" alt="Chats" label="Chats" />
        <SidebarItem src="/icons/send.webp" alt="Applications" label="Applications" />
        <SidebarItem src="/icons/settings.webp" alt="Guest Invitations" label="Guest Invitations" />
        <SidebarItem src="/icons/heart.webp" alt="My Bookings" label="My Bookings" />
      </div>

      <div className="mt-auto">
        <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
};
