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

export const TENANT_MENU_ITEMS: MenuItem[] = [...GUEST_MENU_ITEMS];
export const HOST_MENU_ITEMS: MenuItem[] = [...GUEST_MENU_ITEMS];
export const DUAL_MENU_ITEMS: MenuItem[] = [...GUEST_MENU_ITEMS];
