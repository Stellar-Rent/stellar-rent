import { mock } from 'bun:test';

import type { MockDataStore } from './supabase.mock.data';

const findMatchingRecords = (
  tableName: string,
  mockDataStore: MockDataStore,
  filters: Array<{ column: string; value?: any; values?: any[]; operator: string }>
) => {
  const tableData = mockDataStore[tableName] || new Map();
  if (filters.length === 0) {
    return [];
  }

  const results: any[] = [];
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
  return results;
};

export const createMockChain = (tableName: string, mockDataStore: MockDataStore) => {
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
      const matches = findMatchingRecords(tableName, mockDataStore, chain._filters || []);
      return Promise.resolve({ data: matches[0] ?? null, error: null });
    }),
    maybeSingle: mock(() => Promise.resolve({ data: null, error: null })),
    then: mock((callback: any) => {
      const results = findMatchingRecords(tableName, mockDataStore, chain._filters || []);
      return callback({ data: results, error: null });
    }),
    _filters: [] as Array<{ column: string; value?: any; values?: any[]; operator: string }>,
  };
  return chain;
};
