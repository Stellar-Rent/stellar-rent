import { mock } from 'bun:test';

import { createMockChain } from './supabase.mock.chain';
import { createMockDataStore } from './supabase.mock.data';

/**
 * Creates a comprehensive Supabase mock that includes all necessary methods
 * with this, the undefined is not an object error is fixed by the auth.getUser method
 */
export const createSupabaseMock = () => {
  const mockDataStore = createMockDataStore();

  const mockFrom = mock((tableName: string) => {
    const tableData = mockDataStore[tableName] || new Map();

    return {
      select: mock(() => createMockChain(tableName, mockDataStore)),
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
        const updateChain = createMockChain(tableName, mockDataStore);
        updateChain.eq = mock((column: string, value: any) => {
          updateChain._filters = updateChain._filters || [];
          updateChain._filters.push({ column, value, operator: 'eq' });

          // When update().eq() is called, apply the update
          if (column === 'id' || column === 'public_key') {
            for (const item of tableData.values()) {
              if (item[column] === value) {
                Object.assign(item, { updated_at: new Date().toISOString() });
              }
            }
          }

          return updateChain;
        });
        return updateChain;
      }),
      upsert: mock(() => createMockChain(tableName, mockDataStore)),
      delete: mock(() => {
        const deleteChain = createMockChain(tableName, mockDataStore);
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
