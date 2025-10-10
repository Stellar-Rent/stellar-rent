// apps/web/src/config/auth.config.ts
export const authConfig = {
  MOCK_AUTH: true,

  // Default user (Guest)
  MOCK_USER: {
    id: 'mock-guest-123',
    email: 'guest@stellarent.com',
    name: 'Demo Guest',
    role: 'guest' as const,
    hostStatus: 'none' as const,
    hasProperties: false,
    propertyCount: 0,
    hasBookings: true,
    bookingCount: 3,
    publicKey: 'GBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    authType: 'email' as const,
  },

  // Mock users for testing
  MOCK_USERS: {
    guest: {
      id: 'mock-guest-123',
      name: 'Demo Guest',
      email: 'guest@stellarent.com',
      role: 'guest' as const,
      hostStatus: 'none' as const,
      hasProperties: false,
      propertyCount: 0,
      hasBookings: true,
      bookingCount: 3,
    },
    host: {
      id: 'mock-host-456',
      name: 'Demo Host',
      email: 'host@stellarent.com',
      role: 'host' as const,
      hostStatus: 'verified' as const,
      hasProperties: true,
      propertyCount: 3,
      hasBookings: false,
      bookingCount: 0,
      hostSince: '2024-01-15',
    },
    dual: {
      id: 'mock-dual-789',
      name: 'Demo Dual User',
      email: 'dual@stellarent.com',
      role: 'dual' as const,
      hostStatus: 'verified' as const,
      hasProperties: true,
      propertyCount: 2,
      hasBookings: true,
      bookingCount: 5,
      hostSince: '2024-03-20',
    },
  },
} as const;

