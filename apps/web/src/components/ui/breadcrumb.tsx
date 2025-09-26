'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  className?: string;
  showHome?: boolean;
  customItems?: BreadcrumbItem[];
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Skip UUIDs and booking IDs in breadcrumbs for cleaner display
    if (segment.match(/^[a-f0-9-]{36}$/) || segment.match(/^\d+$/)) {
      continue;
    }

    // Map common segments to friendly names
    const segmentMappings: Record<string, string> = {
      dashboard: 'Dashboard',
      'tenant-dashboard': 'My Dashboard',
      'host-dashboard': 'Host Dashboard',
      booking: 'Booking',
      confirmation: 'Confirmation',
      bookings: 'My Bookings',
      property: 'Property',
      search: 'Search Properties',
    };

    const label =
      segmentMappings[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

    items.push({ label, href: currentPath });
  }

  return items;
}

export function Breadcrumb({ className = '', showHome = true, customItems }: BreadcrumbProps) {
  const pathname = usePathname();

  const breadcrumbItems = customItems || generateBreadcrumbsFromPath(pathname);

  if (pathname === '/' && !customItems) {
    return null;
  }

  const displayItems = showHome ? breadcrumbItems : breadcrumbItems.slice(1);

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <nav
      className={`flex items-center space-x-1 text-sm text-muted-foreground mb-6 ${className}`}
      aria-label="Breadcrumb"
    >
      {displayItems.map((item, index) => (
        <div key={`${item.href}-${index}`} className="flex items-center">
          {index > 0 && <ChevronRight className="w-4 h-4 mx-1 flex-shrink-0" />}

          {index === displayItems.length - 1 || item.isActive ? (
            <span className="text-foreground font-medium flex items-center">
              {index === 0 && showHome && item.href === '/' && <Home className="w-4 h-4 mr-1" />}
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors flex items-center"
            >
              {index === 0 && showHome && item.href === '/' && <Home className="w-4 h-4 mr-1" />}
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

export default Breadcrumb;
