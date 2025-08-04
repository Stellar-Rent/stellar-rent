import { config } from 'dotenv';

// Load environment variables for testing
config({ path: '.env.test' });

// Set test environment variables
Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true });
Object.defineProperty(process.env, 'JWT_SECRET', { value: 'test-secret-key', writable: true });
Object.defineProperty(process.env, 'STELLAR_NETWORK', { value: 'testnet', writable: true });
Object.defineProperty(process.env, 'TRUSTLESS_WORK_API_URL', {
  value: 'https://api.test.trustlesswork.com',
  writable: true,
});
Object.defineProperty(process.env, 'TRUSTLESS_WORK_API_KEY', {
  value: 'test-api-key',
  writable: true,
});
Object.defineProperty(process.env, 'BOOKING_CONTRACT_ADDRESS', {
  value: 'CB3ILSDNHL6TWZYZJAS4L27GLHNAGW4ISW6YXIBHGHL4QYI4JPLP6W3E',
  writable: true,
});
Object.defineProperty(process.env, 'SUPABASE_URL', {
  value: 'https://test.supabase.co/',
  writable: true,
});
Object.defineProperty(process.env, 'SUPABASE_SERVICE_ROLE_KEY', {
  value: 'test-service-role-key',
  writable: true,
});

// Global test timeout
jest.setTimeout(30000);

// Suppress console logs during tests unless explicitly needed
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  // Suppress console output during tests
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore console output
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Global test utilities
global.testUtils = {
  generateUUID: () => {
    const { v4: uuidv4 } = require('uuid');
    return uuidv4();
  },

  generateTransactionHash: () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return `txn_${Array.from({ length: 64 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')}`;
  },

  generateEscrowAddress: () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return `G${Array.from({ length: 55 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')}`;
  },

  waitForCondition: async (condition: () => boolean, timeoutMs = 5000): Promise<boolean> => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      if (condition()) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return false;
  },

  simulateDelay: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
};

// Mock fetch for external API calls
global.fetch = jest.fn() as unknown as typeof fetch;

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => {
      const { v4: uuidv4 } = require('uuid');
      return uuidv4();
    },
  },
});
