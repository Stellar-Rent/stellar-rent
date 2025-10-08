export interface MenuItem {
  id: string;
  src: string;
  alt: string;
  label: string;
  href: string;
  withContainer?: boolean;
}

export const GUEST_MENU_ITEMS: MenuItem[] = [
  { id: 'menu', src: '/icons/menu.webp', alt: 'Menu', label: 'Menu', href: '#' },
  {
    id: 'search',
    src: '/icons/search.webp',
    alt: 'Find a Property',
    label: 'Find a Property',
    href: '/search',
    withContainer: true,
  },
];

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
    href: '/dashboard/guest?tab=calendar',
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
    href: '/dashboard/guest?tab=bookings',
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
    href: '/dashboard/host',
    withContainer: true,
  },
  {
    id: 'calendar',
    src: '/icons/lock.webp',
    alt: 'Property Calendar',
    label: 'Property Calendar',
    href: '/dashboard/host?tab=calendar',
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
    href: '/dashboard/host?tab=bookings',
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
    href: '/dashboard/guest',
  },
  {
    id: 'my-properties',
    src: '/icons/lock.webp',
    alt: 'My Properties',
    label: 'My Properties',
    href: '/dashboard/host',
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
    href: '/dashboard/guest?tab=calendar',
  },
];
