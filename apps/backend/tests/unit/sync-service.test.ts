/**
 * Sync Service Unit Tests
 *
 * Tests the sync service functionality in isolation
 */

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { SyncService } from '../../src/services/sync.service';

// Mock Supabase
const mockSupabaseFrom = mock((_table: string) => ({
  select: mock(() => ({
    single: mock(() =>
      Promise.resolve({
        data: {
          last_processed_block: 100,
          total_events_processed: 50,
          failed_events: 2,
          last_sync_time: new Date().toISOString(),
        },
        error: null,
      })
    ),
    order: mock(() => ({
      limit: mock(() =>
        Promise.resolve({
          data: [{ id: '1', event_type: 'test', processed: true }],
          error: null,
        })
      ),
    })),
    eq: mock(() => ({
      not: mock(() =>
        Promise.resolve({
          data: [{ id: '1', error: 'test error' }],
          error: null,
        })
      ),
    })),
  })),
  insert: mock(() => Promise.resolve({ data: null, error: null })),
  update: mock(() => ({
    eq: mock(() => Promise.resolve({ data: null, error: null })),
  })),
  upsert: mock(() => Promise.resolve({ data: null, error: null })),
}));

// Mock the supabase module
mock.module('../../src/config/supabase', () => ({
  supabase: {
    from: mockSupabaseFrom,
  },
}));

// Mock logging service
mock.module('../../src/services/logging.service', () => ({
  loggingService: {
    logBlockchainOperation: mock(() => Promise.resolve('test-log-id')),
    logBlockchainSuccess: mock(() => Promise.resolve()),
    logBlockchainError: mock(() => Promise.resolve()),
  },
}));

describe('SyncService', () => {
  let syncService: SyncService;

  beforeEach(() => {
    // Set up test environment
    process.env.SOROBAN_RPC_URL = 'https://test-rpc.stellar.org';
    process.env.SOROBAN_CONTRACT_ID = 'TEST_CONTRACT';
<<<<<<< HEAD
    process.env.SOROBAN_NETWORK_PASSPHRASE =
      'Test SDF Network ; September 2015';
=======
<<<<<<< HEAD
<<<<<<< HEAD
    process.env.SOROBAN_NETWORK_PASSPHRASE =
      'Test SDF Network ; September 2015';
=======
    process.env.SOROBAN_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
>>>>>>> f4a72f1 (feat: connect smart contracts to backend APIs)
=======
    process.env.SOROBAN_NETWORK_PASSPHRASE =
      'Test SDF Network ; September 2015';
>>>>>>> dac9586 (fix: biome issues)
>>>>>>> Clement-coder-feature/dashboard-selector
    process.env.SYNC_POLL_INTERVAL = '1000';

    syncService = new SyncService();
  });

  afterEach(async () => {
    // Ensure service is stopped after each test
    if (syncService.getStatus().isRunning) {
      await syncService.stop();
    }
    mock.restore();
  });

  describe('Constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(syncService).toBeDefined();
      expect(syncService.getPollingIntervalMs()).toBe(1000);
    });

    it('should throw error with missing required env vars', () => {
      process.env.SOROBAN_RPC_URL = undefined;

<<<<<<< HEAD
      expect(() => new SyncService()).toThrow(
        'Missing required environment variables'
      );
=======
<<<<<<< HEAD
<<<<<<< HEAD
      expect(() => new SyncService()).toThrow(
        'Missing required environment variables'
      );
=======
      expect(() => new SyncService()).toThrow('Missing required environment variables');
>>>>>>> f4a72f1 (feat: connect smart contracts to backend APIs)
=======
      expect(() => new SyncService()).toThrow(
        'Missing required environment variables'
      );
>>>>>>> dac9586 (fix: biome issues)
>>>>>>> Clement-coder-feature/dashboard-selector

      // Restore for other tests
      process.env.SOROBAN_RPC_URL = 'https://test-rpc.stellar.org';
    });

    it('should validate network passphrase', () => {
      process.env.SOROBAN_NETWORK_PASSPHRASE = 'invalid';

      expect(() => new SyncService()).toThrow('Invalid network passphrase');

      // Restore
<<<<<<< HEAD
      process.env.SOROBAN_NETWORK_PASSPHRASE =
        'Test SDF Network ; September 2015';
=======
<<<<<<< HEAD
<<<<<<< HEAD
      process.env.SOROBAN_NETWORK_PASSPHRASE =
        'Test SDF Network ; September 2015';
=======
      process.env.SOROBAN_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
>>>>>>> f4a72f1 (feat: connect smart contracts to backend APIs)
=======
      process.env.SOROBAN_NETWORK_PASSPHRASE =
        'Test SDF Network ; September 2015';
>>>>>>> dac9586 (fix: biome issues)
>>>>>>> Clement-coder-feature/dashboard-selector
    });

    it('should use default polling interval if not set', () => {
      process.env.SYNC_POLL_INTERVAL = undefined;

      const service = new SyncService();
      expect(service.getPollingIntervalMs()).toBe(5000); // default

      // Restore
      process.env.SYNC_POLL_INTERVAL = '1000';
    });

    it('should validate polling interval range', () => {
      process.env.SYNC_POLL_INTERVAL = '500'; // too low

      const service = new SyncService();
      expect(service.getPollingIntervalMs()).toBe(5000); // default fallback

      process.env.SYNC_POLL_INTERVAL = '500000'; // too high
      const service2 = new SyncService();
      expect(service2.getPollingIntervalMs()).toBe(5000); // default fallback

      // Restore
      process.env.SYNC_POLL_INTERVAL = '1000';
    });
  });

  describe('Service Lifecycle', () => {
    it('should start successfully', async () => {
      expect(syncService.getStatus().isRunning).toBe(false);

      await syncService.start();

      expect(syncService.getStatus().isRunning).toBe(true);
    });

    it('should stop successfully', async () => {
      await syncService.start();
      expect(syncService.getStatus().isRunning).toBe(true);

      await syncService.stop();

      expect(syncService.getStatus().isRunning).toBe(false);
    });

    it('should not start if already running', async () => {
      await syncService.start();

      // Should not throw or cause issues
      await syncService.start();

      expect(syncService.getStatus().isRunning).toBe(true);
    });

    it('should not stop if not running', async () => {
      expect(syncService.getStatus().isRunning).toBe(false);

      // Should not throw
      await syncService.stop();

      expect(syncService.getStatus().isRunning).toBe(false);
    });
  });

  describe('Status and Statistics', () => {
    it('should return correct initial status', () => {
      const status = syncService.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.lastSyncTime).toBe(null);
      expect(status.totalEventsProcessed).toBe(0);
      expect(status.failedEvents).toBe(0);
      expect(status.currentBlockHeight).toBe(0);
      expect(status.lastProcessedBlock).toBe(0);
    });

    it('should return sync statistics', async () => {
      const stats = await syncService.getSyncStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalEvents).toBe('number');
      expect(typeof stats.failedEvents).toBe('number');
      expect(stats.status).toBeDefined();
    });
  });

  describe('Manual Sync', () => {
    it('should trigger manual sync', async () => {
      // Should not throw
      await syncService.triggerManualSync();

      // Verify it was called
      expect(true).toBe(true); // Basic test that it doesn't crash
    });
  });

  describe('Event Processing', () => {
    it('should trigger manual sync without errors', async () => {
      // Test that manual sync doesn't throw errors
      await syncService.triggerManualSync();
      expect(true).toBe(true); // Basic test that it doesn't crash
    });
  });

  describe('Network Configuration', () => {
    it('should initialize with valid network configuration', () => {
      // Test that the service initializes with valid network settings
      expect(syncService).toBeDefined();
      expect(syncService.getPollingIntervalMs()).toBe(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', () => {
      // Test with invalid RPC URL format
      process.env.SOROBAN_RPC_URL = 'invalid-url';

      // Should still construct but may fail on actual operations
      const service = new SyncService();
      expect(service).toBeDefined();

      // Restore
      process.env.SOROBAN_RPC_URL = 'https://test-rpc.stellar.org';
    });

    it('should handle sync operations gracefully', async () => {
      // Should handle sync operations without throwing
      await syncService.start();
      const status = syncService.getStatus();

      expect(status.isRunning).toBe(true);
      await syncService.stop();
    });
  });
});
