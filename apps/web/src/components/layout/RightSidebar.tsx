'use client';

import { User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import {
  DUAL_MENU_ITEMS,
  GUEST_MENU_ITEMS,
  HOST_MENU_ITEMS,
  type MenuItem,
  TENANT_MENU_ITEMS,
} from '~/constants/menu-items';
import { useAuth } from '~/hooks/auth/use-auth';
import { useUserRole } from '~/hooks/useUserRole';
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
  const { isAuthenticated } = useAuth();
  const { role } = useUserRole();

  const menuItems: MenuItem[] = useMemo(() => {
    if (!isAuthenticated) return GUEST_MENU_ITEMS;
    switch (role) {
      case 'host':
        return HOST_MENU_ITEMS;
      case 'dual':
        return DUAL_MENU_ITEMS;
      default:
        return TENANT_MENU_ITEMS;
    }
  }, [role, isAuthenticated]);

  return (
    <div className="fixed right-0 top-0 h-full w-12 bg-secondary flex flex-col items-center py-3 z-40 rounded-s-3xl">
      {/* Navigation Icons */}
      <div className="flex flex-col items-center space-y-3">
        {menuItems.map((item) => (
          <Link href={item.href} key={item.id}>
            <SidebarItem
              src={item.src}
              alt={item.alt}
              label={item.label}
              withContainer={item.withContainer}
            />
          </Link>
        ))}
      </div>

      <div className="mt-auto">
        <Link href={isAuthenticated ? '/dashboard' : '/login'}>
          <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
        </Link>
      </div>
    </div>
  );
};
