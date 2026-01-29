import { mock } from 'bun:test';
import path from 'node:path';

import { createSupabaseMock } from './supabase.mock';

/**
 * Sets up the Supabase mock module for Bun tests.
 * Registers multiple specifiers so app and test imports resolve to the same mock.
 */
export const setupSupabaseMock = (
  modulePaths: string[] = ['../../src/config/supabase', '../config/supabase', './supabase']
) => {
  const mockSupabase = createSupabaseMock();
  const resolvedSupabasePath = path.resolve(
    import.meta.dir,
    '../../src/config/supabase'
  );
  const allModulePaths = [
    ...modulePaths,
    resolvedSupabasePath,
    `${resolvedSupabasePath}.ts`,
    `${resolvedSupabasePath}.js`,
  ];
  const uniqueModulePaths = Array.from(new Set(allModulePaths));

  uniqueModulePaths.forEach((modulePath) => {
    mock.module(modulePath, () => ({
      supabase: mockSupabase,
    }));
  });

  return mockSupabase;
};
