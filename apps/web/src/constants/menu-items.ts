export interface MenuItem {
  id: string;
  src: string;
  alt: string;
  label: string;
  href: string;
  withContainer?: boolean;
}

const ICON_MENU = { id: 'menu', src: '/icons/menu.webp', alt: 'Menu', label: 'Menu', href: '#' };
const ICON_SEARCH = {
  id: 'search',
  src: '/icons/search.webp',
  alt: 'Search',
  label: 'Find a Property',
  href: '/search',
  withContainer: true,
};
const ICON_FAVORITES = {
  id: 'favorites',
  src: '/icons/heart.webp',
  alt: 'Favorites',
  label: 'Favorites',
  href: '/dashboard/guest?tab=bookings',
};
const ICON_MESSAGES = {
  id: 'messages',
  src: '/icons/send.webp',
  alt: 'Messages',
  label: 'Messages',
  href: '/messages',
  withContainer: true,
};

// CORRECCIÓN: Renombramos 'Settings' a 'Invitations' para que coincida con la ruta /invitations
const ICON_INVITATIONS = {
  id: 'invitations',
  src: '/icons/settings.webp',
  alt: 'Invitations',
  label: 'Invitations',
  href: '/invitations',
};

const ICON_LOCK = { id: 'lock', src: '/icons/lock.webp', alt: 'Lock', label: 'Private', href: '#' };
const ICON_APPLICATIONS = {
  id: 'applications',
  src: '/icons/message.webp',
  alt: 'Applications',
  label: 'Applications',
  href: '/applications',
};

export const GUEST_MENU_ITEMS: MenuItem[] = [
  ICON_MENU,
  ICON_SEARCH,
  ICON_FAVORITES,
  ICON_MESSAGES,
  ICON_INVITATIONS, // Ahora el nombre es semánticamente correcto
  ICON_LOCK,
  ICON_APPLICATIONS,
];

<<<<<<< HEAD
export const TENANT_MENU_ITEMS: MenuItem[] = [...GUEST_MENU_ITEMS];
export const HOST_MENU_ITEMS: MenuItem[] = [...GUEST_MENU_ITEMS];
export const DUAL_MENU_ITEMS: MenuItem[] = [...GUEST_MENU_ITEMS];
=======
export const TENANT_MENU_ITEMS: MenuItem[] = [
  // TODO: Wire menu item to navigation drawer
  { id: 'menu', src: '/icons/menu.webp', alt: 'Menu', label: 'Menu', href: '#' },
  {
    id: 'search',
    src: '/icons/search.webp',
    alt: 'Find a Property',
    label: 'Find a Property',
    href: '/search',
    withContainer: true,
  },
  {
    id: 'calendar',
    src: '/icons/lock.webp',
    alt: 'My Calendar',
    label: 'My Calendar',
    href: '/dashboard/tenant-dashboard?tab=calendar',
  },
  {
    id: 'messages',
    src: '/icons/message.webp',
    alt: 'Messages',
    label: 'Messages',
    href: '/messages',
  },
  {
    id: 'applications',
    src: '/icons/send.webp',
    alt: 'Applications',
    label: 'Applications',
    href: '/applications',
  },
  {
    id: 'invitations',
    src: '/icons/settings.webp',
    alt: 'Guest Invitations',
    label: 'Guest Invitations',
    href: '/invitations',
  },
  {
    id: 'bookings',
    src: '/icons/heart.webp',
    alt: 'My Bookings',
    label: 'My Bookings',
    href: '/dashboard/tenant-dashboard?tab=bookings',
  },
];

export const HOST_MENU_ITEMS: MenuItem[] = [
  // TODO: Wire menu item to navigation drawer
  { id: 'menu', src: '/icons/menu.webp', alt: 'Menu', label: 'Menu', href: '#' },
  {
    id: 'properties',
    src: '/icons/search.webp',
    alt: 'My Properties',
    label: 'My Properties',
    href: '/dashboard/host-dashboard',
    withContainer: true,
  },
  {
    id: 'calendar',
    src: '/icons/lock.webp',
    alt: 'Property Calendar',
    label: 'Property Calendar',
    href: '/dashboard/host-dashboard?tab=calendar',
  },
  {
    id: 'messages',
    src: '/icons/message.webp',
    alt: 'Messages',
    label: 'Messages',
    href: '/messages',
  },
  {
    id: 'applications',
    src: '/icons/send.webp',
    alt: 'Applications',
    label: 'Booking Requests',
    href: '/applications',
  },
  {
    id: 'list',
    src: '/icons/settings.webp',
    alt: 'List Property',
    label: 'List Property',
    href: '/list',
  },
  {
    id: 'bookings',
    src: '/icons/heart.webp',
    alt: 'Bookings',
    label: 'Bookings',
    href: '/dashboard/host-dashboard?tab=bookings',
  },
];

export const DUAL_MENU_ITEMS: MenuItem[] = [
  // TODO: Wire menu item to navigation drawer
  { id: 'menu', src: '/icons/menu.webp', alt: 'Menu', label: 'Menu', href: '#' },
  {
    id: 'search',
    src: '/icons/search.webp',
    alt: 'Browse',
    label: 'Browse Properties',
    href: '/search',
    withContainer: true,
  },
  {
    id: 'my-bookings',
    src: '/icons/heart.webp',
    alt: 'My Bookings',
    label: 'My Bookings',
    href: '/dashboard/tenant-dashboard',
  },
  {
    id: 'my-properties',
    src: '/icons/lock.webp',
    alt: 'My Properties',
    label: 'My Properties',
    href: '/dashboard/host-dashboard',
  },
  {
    id: 'messages',
    src: '/icons/message.webp',
    alt: 'Messages',
    label: 'Messages',
    href: '/messages',
  },
  {
    id: 'applications',
    src: '/icons/send.webp',
    alt: 'Applications',
    label: 'Applications',
    href: '/applications',
  },
  {
    id: 'calendar',
    src: '/icons/settings.webp',
    alt: 'Calendar',
    label: 'Calendar',
    href: '/dashboard/tenant-dashboard?tab=calendar',
  },
];
>>>>>>> origin/main
