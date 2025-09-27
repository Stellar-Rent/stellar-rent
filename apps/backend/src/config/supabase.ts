import { createClient } from '@supabase/supabase-js';
import type {
  AvailabilityRange,
  CancellationPolicy,
} from '../types/property.types';

// Define your database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
          password_hash: string;
        };
        Insert: {
          email: string;
          name: string;
          password_hash: string;
        };
        Update: {
          email?: string;
          name?: string;
          password_hash?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name?: string;
          avatar_url?: string;
          phone?: string;
          address?: string;
          preferences?: Record<string, unknown>;
          social_links?: Record<string, unknown>;
          verification_status: 'verified' | 'unverified' | 'pending';
          last_active: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          avatar_url?: string;
          phone?: string;
          address?: string;
          preferences?: Record<string, unknown>;
          social_links?: Record<string, unknown>;
          verification_status?: 'verified' | 'unverified' | 'pending';
          last_active?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          avatar_url?: string;
          phone?: string;
          address?: string;
          preferences?: Record<string, unknown>;
          social_links?: Record<string, unknown>;
          verification_status?: 'verified' | 'unverified' | 'pending';
          last_active?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          title: string;
          description: string;
          price: number;
          address: string;
          city: string;
          country: string;
          latitude: number | null;
          longitude: number | null;
          amenities: string[];
          images: string[];
          bedrooms: number;
          bathrooms: number;
          max_guests: number;
          owner_id: string;
          status: 'available' | 'booked' | 'maintenance';
          availability: AvailabilityRange[];
          security_deposit: number;
          cancellation_policy: CancellationPolicy | null;
          property_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          price: number;
          address: string;
          city: string;
          country: string;
          latitude?: number | null;
          longitude?: number | null;
          amenities?: string[];
          images?: string[];
          bedrooms: number;
          bathrooms: number;
          max_guests: number;
          owner_id: string;
          status?: 'available' | 'booked' | 'maintenance';
          availability?: AvailabilityRange[];
          security_deposit?: number;
          cancellation_policy?: CancellationPolicy | null;
          property_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['properties']['Insert']>;
      };

      bookings: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          amount: number;
          status: 'pending' | 'confirmed' | 'cancelled';
          start_date: string;
          end_date: string;
          escrow_address: string | null;
          transaction_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          property_id: string;
          amount: number;
          status?: 'pending' | 'confirmed' | 'cancelled';
          start_date: string;
          end_date: string;
          escrow_address?: string;
          transaction_hash?: string;
        };
        Update: {
          amount?: number;
          status?: 'pending' | 'confirmed' | 'cancelled';
          start_date?: string;
          end_date?: string;
          escrow_address?: string;
          transaction_hash?: string;
          updated_at?: string;
        };
      };
      //===================
      // Wallet challenge schema
      //===================
      wallet_challenges: {
        Row: {
          id: string;
          public_key: string;
          challenge: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          public_key: string;
          challenge: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          expires_at?: string;
        };
      };
      wallet_users: {
        Row: {
          id: string;
          public_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          public_key: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          updated_at?: string;
        };
      };
    };
  };
};

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

// Mock Supabase for tests
const createMockSupabase = () => {
  // Store mock data with proper typing
<<<<<<< HEAD
  type MockData = Record<string, Map<string, unknown>>;
=======
  type MockData = Record<string, Map<string, unknown> | unknown[]>;
>>>>>>> f4a72f1 (feat: connect smart contracts to backend APIs)
  const mockData: MockData = {
    wallet_challenges: new Map(),
    wallet_users: new Map(),
    users: new Map(),
    properties: new Map(),
    bookings: new Map(),
<<<<<<< HEAD
    sync_events: new Map(),
    sync_state: new Map([
      [
        '1',
        {
          id: 1,
          last_processed_block: 0,
          total_events_processed: 0,
          failed_events: 0,
          last_sync_time: null,
          updated_at: new Date().toISOString(),
        },
      ],
    ]),
    sync_logs: new Map(),
=======
>>>>>>> f4a72f1 (feat: connect smart contracts to backend APIs)
  };

  // Helper function to get mock data for each table
  const getMockDataForTable = (tableName: string) => {
    switch (tableName) {
      case 'wallet_challenges':
        return {
          id: 'test-challenge-id',
          public_key: 'test-public-key',
          challenge: 'test-challenge-value',
          expires_at: new Date(Date.now() + 300000).toISOString(), // 5 minutes from now
          created_at: new Date().toISOString(),
        };

      case 'bookings':
        return {
          id: '123e4567-e89b-12d3-a456-426614174555',
          property: 'Seaside Villa',
          dates: { from: '2025-06-01', to: '2025-06-05' },
          hostContact: 'host@example.com',
          escrowStatus: 'pending',
          user_id: 'test-user-id',
          property_id: 'test-property-id',
          total: 100,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

      default:
        return null;
    }
  };

  const createMockChain = (tableName: string) => {
    type FilterValue = string | number | boolean | null | undefined;
<<<<<<< HEAD
    const filters: Array<{
      column: string;
      value: FilterValue;
      operator: string;
    }> = [];
=======
    const filters: Array<{ column: string; value: FilterValue; operator: string }> = [];
>>>>>>> f4a72f1 (feat: connect smart contracts to backend APIs)

    const chain = {
      _tableName: tableName,
      _filters: filters,

      // Query methods
      select: () => chain,
      eq: (column: string, value: FilterValue) => {
        filters.push({ column, value, operator: 'eq' });
        return chain;
      },
      gt: (column: string, value: FilterValue) => {
        filters.push({ column, value, operator: 'gt' });
        return chain;
      },

      // Unused filter methods - just return chain for compatibility
      lt: () => chain,
      gte: () => chain,
      lte: () => chain,
      neq: () => chain,
      like: () => chain,
      ilike: () => chain,
      is: () => chain,
      in: () => chain,
      contains: () => chain,
      containedBy: () => chain,
      rangeGt: () => chain,
      rangeGte: () => chain,
      rangeLt: () => chain,
      rangeLte: () => chain,
      rangeAdjacent: () => chain,
      overlaps: () => chain,
      textSearch: () => chain,
      match: () => chain,
      not: () => chain,
      or: () => chain,
      filter: () => chain,
      order: () => chain,
      limit: () => chain,
      range: () => chain,
      abortSignal: () => chain,
      single: () => {
        // Handle special filter cases
        if (filters.length > 0) {
          const hasNonExistentChallenge = filters.some(
<<<<<<< HEAD
            (f) =>
              f.column === 'challenge' && f.value === 'non-existent-challenge'
=======
            (f) => f.column === 'challenge' && f.value === 'non-existent-challenge'
>>>>>>> f4a72f1 (feat: connect smart contracts to backend APIs)
          );
          if (hasNonExistentChallenge) {
            return Promise.resolve({ data: null, error: null });
          }

          const hasExpiredChallenge = filters.some(
            (f) =>
<<<<<<< HEAD
              f.column === 'expires_at' &&
              f.operator === 'gt' &&
              f.value &&
              new Date(f.value as string | number | Date) < new Date()
=======
              f.column === 'expires_at' && f.operator === 'gt' && new Date(f.value) < new Date()
>>>>>>> f4a72f1 (feat: connect smart contracts to backend APIs)
          );
          if (hasExpiredChallenge) {
            return Promise.resolve({ data: null, error: null });
          }
        }

        // Return mock data based on table
        return Promise.resolve({
          data: getMockDataForTable(tableName),
          error: null,
        });
      },
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (callback: any) => {
        // Handle special filter cases
        if (filters.length > 0) {
          const hasNonExistentChallenge = filters.some(
<<<<<<< HEAD
            (f) =>
              f.column === 'challenge' && f.value === 'non-existent-challenge'
=======
            (f) => f.column === 'challenge' && f.value === 'non-existent-challenge'
>>>>>>> f4a72f1 (feat: connect smart contracts to backend APIs)
          );
          if (hasNonExistentChallenge) {
            return callback({ data: [], error: null });
          }

          const hasExpiredChallenge = filters.some(
            (f) =>
<<<<<<< HEAD
              f.column === 'expires_at' &&
              f.operator === 'gt' &&
              f.value &&
              new Date(f.value as string | number | Date) < new Date()
=======
              f.column === 'expires_at' && f.operator === 'gt' && new Date(f.value) < new Date()
>>>>>>> f4a72f1 (feat: connect smart contracts to backend APIs)
          );
          if (hasExpiredChallenge) {
            return callback({ data: [], error: null });
          }
        }

        // Return mock data as array
        const mockData = getMockDataForTable(tableName);
        const data = mockData ? [mockData] : [];
        return callback({ data, error: null });
      },
    };
    return chain;
  };

  const mockQuery = (tableName: string) => ({
    select: () => createMockChain(tableName),
    insert: (data: any) => {
      const insertChain = {
        select: () => ({
          single: () => {
            const id = `mock-${Date.now()}`;
            const record = {
              id,
              ...data,
              created_at: new Date().toISOString(),
            };
            if (mockData[tableName]) {
              mockData[tableName].set(id, record);
            }
            return Promise.resolve({ data: record, error: null });
          },
          then: (callback: any) => {
            const id = `mock-${Date.now()}`;
            const record = {
              id,
              ...data,
              created_at: new Date().toISOString(),
            };
            if (mockData[tableName]) {
              mockData[tableName].set(id, record);
            }
            return callback({ data: [record], error: null });
          },
        }),
        single: () => {
          const id = `mock-${Date.now()}`;
          const record = { id, ...data, created_at: new Date().toISOString() };
          if (mockData[tableName]) {
            mockData[tableName].set(id, record);
          }
          return Promise.resolve({ data: record, error: null });
        },
        then: (callback: any) => {
          const id = `mock-${Date.now()}`;
          const record = { id, ...data, created_at: new Date().toISOString() };
          if (mockData[tableName]) {
            mockData[tableName].set(id, record);
          }
          return callback({ data: [record], error: null });
        },
      };
      return insertChain;
    },
    update: () => createMockChain(tableName),
    upsert: () => createMockChain(tableName),
    delete: () => createMockChain(tableName),
    then: (callback: any) => callback({ data: [], error: null }),
  });

  return {
    from: (tableName: string) => mockQuery(tableName),
    auth: {
      getUser: (token: string) => {
        // Return error for invalid tokens
        if (token === 'invalid.token') {
          return Promise.resolve({
            data: { user: null },
            error: { message: 'Invalid token' },
          });
        }
        return Promise.resolve({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        });
      },
      signInWithPassword: () =>
        Promise.resolve({
<<<<<<< HEAD
          data: {
            user: { id: 'test-user-id', email: 'test@example.com' },
            session: null,
          },
=======
          data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: null },
>>>>>>> f4a72f1 (feat: connect smart contracts to backend APIs)
          error: null,
        }),
      signUp: () =>
        Promise.resolve({
<<<<<<< HEAD
          data: {
            user: { id: 'test-user-id', email: 'test@example.com' },
            session: null,
          },
=======
          data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: null },
>>>>>>> f4a72f1 (feat: connect smart contracts to backend APIs)
          error: null,
        }),
    },
  };
};

// Use mock in test environment, real client otherwise
export const supabase =
  process.env.NODE_ENV === 'test'
    ? (createMockSupabase() as any)
    : (() => {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
<<<<<<< HEAD
          throw new Error(
            'Missing SUPABASE_SERVICE_ROLE_KEY environment variable'
          );
=======
          throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
>>>>>>> f4a72f1 (feat: connect smart contracts to backend APIs)
        }

        return createClient<Database>(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
            db: {
              schema: 'public',
            },
          }
        );
      })();
