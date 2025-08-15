// Mock types for testing
export interface MockSupabaseQueryBuilder {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  upsert: jest.Mock;
  eq: jest.Mock;
  not: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  range: jest.Mock;
  single: jest.Mock;
}

export interface MockSupabaseClient {
  from: jest.Mock<MockSupabaseQueryBuilder>;
}

// Type for accessing private methods in tests
export interface SyncServiceTestAccess {
  processEvent: (event: Record<string, unknown>) => Promise<void>;
  pollForEvents: () => Promise<void>;
  mapBlockchainStatus: (status: string) => string;
}
