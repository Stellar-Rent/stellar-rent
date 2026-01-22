import { mock } from 'bun:test';

/**
 * Creates a comprehensive Supabase mock that includes all necessary methods
 * with this, the undefined is not an object error is fixed by the auth.getUser method
 */
export const createSupabaseMock = () => {
  // In-memory storage for mock data
  const mockDataStore: Record<string, Map<string, any>> = {
    wallet_challenges: new Map(),
    wallet_users: new Map(),
    profiles: new Map(),
    bookings: new Map(),
    properties: new Map(),
  };

  const createMockChain = (tableName: string) => {
    const chain = {
      select: mock(() => chain),
      eq: mock((column: string, value: any) => {
        chain._filters = chain._filters || [];
        chain._filters.push({ column, value, operator: 'eq' });
        return chain;
      }),
      gt: mock((column: string, value: any) => {
        chain._filters = chain._filters || [];
        chain._filters.push({ column, value, operator: 'gt' });
        return chain;
      }),
      lt: mock((column: string, value: any) => {
        chain._filters = chain._filters || [];
        chain._filters.push({ column, value, operator: 'lt' });
        return chain;
      }),
      in: mock((column: string, values: any[]) => {
        chain._filters = chain._filters || [];
        chain._filters.push({ column, values, operator: 'in' });
        return chain;
      }),
      match: mock((column: string, value: any) => {
        chain._filters = chain._filters || [];
        chain._filters.push({ column, value, operator: 'match' });
        return chain;
      }),
      not: mock(() => chain),
      or: mock(() => chain),
      order: mock(() => chain),
      limit: mock(() => chain),
      single: mock(() => {
        // Try to find matching data based on filters
        const tableData = mockDataStore[tableName] || new Map();
        const filters = chain._filters || [];
        
        // Simple filter matching - find first item that matches all eq filters
        if (filters.length > 0) {
          for (const item of tableData.values()) {
            let matches = true;
            for (const filter of filters) {
              if (filter.operator === 'eq' && item[filter.column] !== filter.value) {
                matches = false;
                break;
              }
              if (filter.operator === 'gt' && new Date(item[filter.column]) <= new Date(filter.value)) {
                matches = false;
                break;
              }
              if (filter.operator === 'lt' && new Date(item[filter.column]) >= new Date(filter.value)) {
                matches = false;
                break;
              }
            }
            if (matches) {
              return Promise.resolve({ data: item, error: null });
            }
          }
        }
        
        return Promise.resolve({ data: null, error: null });
      }),
      maybeSingle: mock(() => Promise.resolve({ data: null, error: null })),
      then: mock((callback: any) => {
        // Try to find matching data based on filters
        const tableData = mockDataStore[tableName] || new Map();
        const filters = chain._filters || [];
        const results: any[] = [];
        
        if (filters.length > 0) {
          for (const item of tableData.values()) {
            let matches = true;
            for (const filter of filters) {
              if (filter.operator === 'eq' && item[filter.column] !== filter.value) {
                matches = false;
                break;
              }
              if (filter.operator === 'gt' && new Date(item[filter.column]) <= new Date(filter.value)) {
                matches = false;
                break;
              }
              if (filter.operator === 'lt' && new Date(item[filter.column]) >= new Date(filter.value)) {
                matches = false;
                break;
              }
            }
            if (matches) {
              results.push(item);
            }
          }
        }
        
        return callback({ data: results, error: null });
      }),
      _filters: [] as Array<{ column: string; value?: any; values?: any[]; operator: string }>,
    };
    return chain;
  };

  const mockFrom = mock((tableName: string) => {
    const tableData = mockDataStore[tableName] || new Map();
    
    return {
      select: mock(() => createMockChain(tableName)),
      insert: mock((data: any) => {
        const id = data.id || `mock-${Date.now()}-${Math.random()}`;
        const record = {
          id,
          ...data,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        };
        tableData.set(id, record);
        
        return {
          select: mock(() => ({
            single: mock(() => Promise.resolve({ data: record, error: null })),
            then: mock((callback: any) => callback({ data: [record], error: null })),
          })),
          single: mock(() => Promise.resolve({ data: record, error: null })),
          then: mock((callback: any) => callback({ data: [record], error: null })),
        };
      }),
      update: mock(() => {
        const updateChain = createMockChain(tableName);
        const originalEq = updateChain.eq;
        updateChain.eq = mock((column: string, value: any) => {
          updateChain._filters = updateChain._filters || [];
          updateChain._filters.push({ column, value, operator: 'eq' });
          
          // When update().eq() is called, apply the update
          if (column === 'id' || column === 'public_key') {
            for (const [key, item] of tableData.entries()) {
              if (item[column] === value) {
                // Update the item
                Object.assign(item, { updated_at: new Date().toISOString() });
              }
            }
          }
          
          return updateChain;
        });
        return updateChain;
      }),
      upsert: mock(() => createMockChain(tableName)),
      delete: mock(() => {
        const deleteChain = createMockChain(tableName);
        const originalEq = deleteChain.eq;
        deleteChain.eq = mock((column: string, value: any) => {
          deleteChain._filters = deleteChain._filters || [];
          deleteChain._filters.push({ column, value, operator: 'eq' });
          
          // When delete().eq() is called, remove matching items
          if (column === 'id' || column === 'public_key') {
            for (const [key, item] of tableData.entries()) {
              if (item[column] === value) {
                tableData.delete(key);
              }
            }
          }
          
          return deleteChain;
        });
        deleteChain.lt = mock((column: string, value: any) => {
          // Delete items where column < value
          for (const [key, item] of tableData.entries()) {
            if (new Date(item[column]) < new Date(value)) {
              tableData.delete(key);
            }
          }
          return deleteChain;
        });
        return deleteChain;
      }),
      then: mock((callback: any) => callback({ data: [], error: null })),
    };
  });

  return {
    from: mockFrom,
    auth: {
      getUser: mock((token?: string) => {
        // Return error for invalid tokens
        if (token === 'invalid.token' || !token) {
          return Promise.resolve({
            data: { user: null },
            error: { message: 'Invalid token' },
          });
        }
        // Return valid user for valid tokens
        return Promise.resolve({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        });
      }),
      signInWithPassword: mock(() =>
        Promise.resolve({
          data: {
            user: { id: 'test-user-id', email: 'test@example.com' },
            session: null,
          },
          error: null,
        })
      ),
      signUp: mock(() =>
        Promise.resolve({
          data: {
            user: { id: 'test-user-id', email: 'test@example.com' },
            session: null,
          },
          error: null,
        })
      ),
    },
  };
};

/**
 * Sets up the Supabase mock module for Bun tests
 * @param modulePath - Optional path to the supabase module. Defaults to '../../src/config/supabase'
 */
export const setupSupabaseMock = (modulePath: string = '../../src/config/supabase') => {
  const mockSupabase = createSupabaseMock();
  
  mock.module(modulePath, () => ({
    supabase: mockSupabase,
  }));

  return mockSupabase;
};
