export interface RouteInfo {
  path: string;
  name: string;
  requiresAuth: boolean;
  description?: string;
}

export const ROUTES: Record<string, RouteInfo> = {
  // Public routes
  HOME: { path: '/', name: 'Home', requiresAuth: false },
  SEARCH: { path: '/search', name: 'Search Properties', requiresAuth: false },
  PROPERTY: {
    path: '/property',
    name: 'Property Details',
    requiresAuth: false,
  },
  LOGIN: { path: '/login', name: 'Login', requiresAuth: false },
  REGISTER: { path: '/register', name: 'Register', requiresAuth: false },
  HELP: { path: '/help', name: 'Help Center', requiresAuth: false },

  // Protected routes
  DASHBOARD: { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
  TENANT_DASHBOARD: {
    path: '/dashboard/tenant-dashboard',
    name: 'My Dashboard',
    requiresAuth: true,
  },
  HOST_DASHBOARD: {
    path: '/dashboard/host-dashboard',
    name: 'Host Dashboard',
    requiresAuth: true,
  },
  LIST_PROPERTY: {
    path: '/list',
    name: 'List Property',
    requiresAuth: true,
  },
  INVITATIONS: {
    path: '/invitations',
    name: 'Guest Invitations',
    requiresAuth: true,
  },
  BOOKING_CONFIRMATION: {
    path: '/booking/confirmation',
    name: 'Booking Confirmation',
    requiresAuth: true,
  },

  // Static pages (public)
  FAQ: { path: '/faq', name: 'FAQs', requiresAuth: false },
  CRYPTO_GUIDE: { path: '/crypto-guide', name: 'Crypto Guide', requiresAuth: false },
  CONTACT: { path: '/contact', name: 'Contact', requiresAuth: false },
  PRIVACY: { path: '/privacy', name: 'Privacy Policy', requiresAuth: false },
  TERMS: { path: '/terms', name: 'Terms of Service', requiresAuth: false },
  COOKIES: { path: '/cookies', name: 'Cookie Policy', requiresAuth: false },
} as const;

export const navigationHelpers = {
  getBookingsUrl: (isAuthenticated: boolean) =>
    isAuthenticated ? '/dashboard/tenant-dashboard' : '/login?redirect=/tenant-dashboard',

  getDashboardUrl: (isAuthenticated: boolean) =>
    isAuthenticated ? '/dashboard/tenant-dashboard' : '/login?redirect=/tenant-dashboard',

  goToHome: () => '/',

  goToProperty: (id: string) => `/property/${id}`,
  goToBookingConfirmation: (bookingId: string) => `/booking/confirmation/${bookingId}`,

  goToLogin: (returnPath?: string) => {
    const redirect = returnPath ? `?redirect=${encodeURIComponent(returnPath)}` : '';
    return `/login${redirect}`;
  },
};

export function getContextualNavigation(
  currentPath: string,
  isAuthenticated: boolean
): Array<{ label: string; href: string; primary?: boolean }> {
  const items = [];

  if (isAuthenticated) {
    items.push({
      label: 'My Dashboard',
      href: '/dashboard/tenant-dashboard',
      primary: !currentPath.includes('dashboard'),
    });

    items.unshift({
      label: 'View Bookings',
      href: '/dashboard/tenant-dashboard',
      primary: true,
    });

    if (!currentPath.includes('booking')) {
      items.push({ label: 'My Bookings', href: '/dashboard/tenant-dashboard' });
    }
  } else {
    items.push({
      label: 'Login',
      href: navigationHelpers.goToLogin(currentPath),
      primary: true,
    });
  }

  return items;
}
