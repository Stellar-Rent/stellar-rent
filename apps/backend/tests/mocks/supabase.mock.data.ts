export type MockDataStore = Record<string, Map<string, any>>;

export const createMockDataStore = (): MockDataStore => ({
  wallet_challenges: new Map(),
  wallet_users: new Map(),
  profiles: new Map(),
  bookings: new Map(),
  properties: new Map(),
});
