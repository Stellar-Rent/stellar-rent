import type { BunTestConfig } from 'bun:test';

const config: BunTestConfig = {
  environment: 'node',
  timeout: 30000,
  setupFiles: ['./tests/setup.ts'],
  preload: ['./tests/types/global.d.ts'],
  coverage: {
    provider: 'bun',
    reporter: ['text', 'html', 'lcov'],
    include: ['src/**/*.ts'],
    exclude: ['src/**/*.d.ts', 'src/index.ts', 'src/tests/**/*.ts'],
  },
};

export default config;
