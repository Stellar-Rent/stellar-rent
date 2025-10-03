'use client';

import { useAuth } from '@/hooks/auth/use-auth';
import { getContextualNavigation } from '@/lib/navigation';
import { usePathname } from 'next/navigation';

export function useContextualNavigation() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const navigationItems = getContextualNavigation(pathname, isAuthenticated);

  return {
    navigationItems,
    currentPath: pathname,
    isAuthenticated,
  };
}

export default useContextualNavigation;
