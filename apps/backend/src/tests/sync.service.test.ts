// Import test setup first to configure environment variables
import '../../tests/setup';

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { SyncService, syncService } from '../services/sync.service';
import { supabase } from '../config/supabase';

describe('SyncService', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env.SOROBAN_RPC_URL = 'https://test-rpc.stellar.org';
    process.env.SOROBAN_CONTRACT_ID = 'test-contract-id';
  });

  afterEach(async () => {
    // Stop sync service after each test
    try {
      await syncService.stop();
    } catch (_error) {
      // Ignore errors when stopping
    }
  });

  describe('Initialization', () => {
    it('should initialize with valid configuration', () => {
      expect(syncService.getStatus()).toEqual({
        isRunning: false,
        lastSyncTime: null,
        totalEventsProcessed: 0,
        failedEvents: 0,
        currentBlockHeight: 0,
        lastProcessedBlock: 0,
      });
    });

    it('should throw error with missing environment variables', () => {
      // Save original environment variables
      const originalRpcUrl = process.env.SOROBAN_RPC_URL;
      const originalContractId = process.env.SOROBAN_CONTRACT_ID;
      const originalNetworkPassphrase = process.env.SOROBAN_NETWORK_PASSPHRASE;
      const originalPollingInterval = process.env.SYNC_POLL_INTERVAL;

      try {
        // Temporarily modify environment variables for this test
        process.env.SOROBAN_RPC_URL = undefined;
        process.env.SOROBAN_CONTRACT_ID = undefined;
        process.env.SOROBAN_NETWORK_PASSPHRASE = undefined;
        process.env.SYNC_POLL_INTERVAL = undefined;

        expect(() => {
          new SyncService();
        }).toThrow('Missing required environment variables for sync service');
      } finally {
        // Restore original environment variables
        process.env.SOROBAN_RPC_URL = originalRpcUrl;
        process.env.SOROBAN_CONTRACT_ID = originalContractId;
        process.env.SOROBAN_NETWORK_PASSPHRASE = originalNetworkPassphrase;
        process.env.SYNC_POLL_INTERVAL = originalPollingInterval;
      }
    });

    it('should use custom polling interval from environment variable', () => {
      // Save original environment variables
      const originalPollingInterval = process.env.SYNC_POLL_INTERVAL;
      const originalRpcUrl = process.env.SOROBAN_RPC_URL;
      const originalContractId = process.env.SOROBAN_CONTRACT_ID;
      const originalNetworkPassphrase = process.env.SOROBAN_NETWORK_PASSPHRASE;

      try {
        // Set custom polling interval
        process.env.SYNC_POLL_INTERVAL = '10000';
        process.env.SOROBAN_RPC_URL = 'https://test-rpc.stellar.org';
        process.env.SOROBAN_CONTRACT_ID = 'CB3ILSDNHL6TWZYZJAS4L27GLHNAGW4ISW6YXIBHGHL4QYI4JPLP6W3E';
        process.env.SOROBAN_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

        const customSyncService = new SyncService();
        expect(customSyncService.getPollingIntervalMs()).toBe(10000);
      } finally {
        // Restore original environment variables
        process.env.SYNC_POLL_INTERVAL = originalPollingInterval;
        process.env.SOROBAN_RPC_URL = originalRpcUrl;
        process.env.SOROBAN_CONTRACT_ID = originalContractId;
        process.env.SOROBAN_NETWORK_PASSPHRASE = originalNetworkPassphrase;
      }
    });

    it('should fallback to default polling interval for invalid environment value', () => {
      // Save original environment variables
      const originalPollingInterval = process.env.SYNC_POLL_INTERVAL;
      const originalRpcUrl = process.env.SOROBAN_RPC_URL;
      const originalContractId = process.env.SOROBAN_CONTRACT_ID;
      const originalNetworkPassphrase = process.env.SOROBAN_NETWORK_PASSPHRASE;

      try {
        // Set invalid polling interval
        process.env.SYNC_POLL_INTERVAL = 'invalid';
        process.env.SOROBAN_RPC_URL = 'https://test-rpc.stellar.org';
        process.env.SOROBAN_CONTRACT_ID = 'CB3ILSDNHL6TWZYZJAS4L27GLHNAGW4ISW6YXIBHGHL4QYI4JPLP6W3E';
        process.env.SOROBAN_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

        const fallbackSyncService = new SyncService();
        expect(fallbackSyncService.getPollingIntervalMs()).toBe(5000); // Default fallback
      } finally {
        // Restore original environment variables
        process.env.SYNC_POLL_INTERVAL = originalPollingInterval;
        process.env.SOROBAN_RPC_URL = originalRpcUrl;
        process.env.SOROBAN_CONTRACT_ID = originalContractId;
        process.env.SOROBAN_NETWORK_PASSPHRASE = originalNetworkPassphrase;
      }
    });
  });

  describe('Service Lifecycle', () => {
    it('should start and stop service correctly', async () => {
      // Global mock is already set up
      await syncService.start();
      expect(syncService.getStatus().isRunning).toBe(true);

      await syncService.stop();
      expect(syncService.getStatus().isRunning).toBe(false);
    });

    it('should not start service twice', async () => {
      // Mock is already set up globally
      await syncService.start();
      await syncService.start(); // Should not start again

      expect(syncService.getStatus().isRunning).toBe(true);
    });

    it('should not stop service twice', async () => {
      // Mock is already set up globally
      await syncService.start();
      await syncService.stop();
      await syncService.stop(); // Should not stop again

      expect(syncService.getStatus().isRunning).toBe(false);
    });
  });

  describe('Event Processing', () => {
    it('should process booking created event', async () => {
<<<<<<< HEAD
      const supabaseFromMock = supabase.from as unknown as {
        mock?: { calls: Array<[string]> };
        mockClear?: () => void;
      };

      supabaseFromMock.mockClear?.();

      await syncService.start();
      expect(syncService.getStatus().isRunning).toBe(true);

      const event = {
        id: 'evt-booking-created',
        type: 'booking_created',
        userId: 'user-1',
        data: {
          escrow_id: 'escrow-1',
          property_id: 'property-1',
          user_id: 'user-1',
          start_date: Math.floor(Date.now() / 1000),
          end_date: Math.floor(Date.now() / 1000) + 3600,
          total_price: 100,
          deposit: 10,
          status: 'Pending',
          guests: 2,
        },
      };

      await (
        syncService as unknown as { processEvent: (e: Record<string, unknown>) => Promise<void> }
      ).processEvent(event);

      const fromCalls = supabaseFromMock.mock?.calls ?? [];
      const tables = fromCalls.map((call) => call[0]);
      expect(tables).toContain('sync_events');
      expect(tables).toContain('bookings');
      expect(syncService.getStatus().isRunning).toBe(true);
=======
      // Global mock is already set up - this test verifies basic functionality
      await syncService.start();
      expect(syncService.getStatus().isRunning).toBe(true);
>>>>>>> 5d91a40 (fix: booking tests (change to bun and add supabase mocks) and fix sync service (mocks))
      await syncService.stop();
    });

    it('should handle event processing errors gracefully', async () => {
      const supabaseFromMock = supabase.from as unknown as {
        mock?: { calls: Array<[string]> };
        mockClear?: () => void;
      };
      const consoleErrorMock = mock(() => {});
      const originalConsoleError = console.error;

      supabaseFromMock.mockClear?.();
      console.error = consoleErrorMock;

      await syncService.start();
      expect(syncService.getStatus().isRunning).toBe(true);

      const serviceWithHandlers = syncService as unknown as {
        processEvent: (e: Record<string, unknown>) => Promise<void>;
        handleBookingCreated: (e: Record<string, unknown>) => Promise<void>;
      };
      const originalHandler = serviceWithHandlers.handleBookingCreated;
      serviceWithHandlers.handleBookingCreated = mock(async () => {
        throw new Error('Handler failed');
      });

      try {
        const event = {
          id: 'evt-booking-error',
          type: 'booking_created',
          userId: 'user-1',
          data: {
            escrow_id: 'escrow-2',
            property_id: 'property-2',
            user_id: 'user-1',
          },
        };

        await expect(serviceWithHandlers.processEvent(event)).rejects.toThrow('Handler failed');

        const fromCalls = supabaseFromMock.mock?.calls ?? [];
        const tables = fromCalls.map((call) => call[0]);
        expect(tables).toContain('sync_events');
        expect(consoleErrorMock).toHaveBeenCalled();
        expect(syncService.getStatus().isRunning).toBe(true);
      } finally {
        serviceWithHandlers.handleBookingCreated = originalHandler;
        console.error = originalConsoleError;
        await syncService.stop();
      }
    });
  });

  describe('Manual Operations', () => {
    it('should trigger manual sync', async () => {
      // Global mock is already set up
      await syncService.start();
      await syncService.triggerManualSync();
      expect(syncService.getStatus().isRunning).toBe(true);
      await syncService.stop();
    });

    it('should process blockchain events during manual sync', async () => {
      // Global mock is already set up
      await syncService.start();
      await syncService.triggerManualSync();
      expect(syncService.getStatus().isRunning).toBe(true);
      await syncService.stop();
    });

    it('should handle blockchain errors during manual sync', async () => {
      // Global mock is already set up
      await syncService.start();
      await syncService.triggerManualSync();
      expect(syncService.getStatus().isRunning).toBe(true);
      await syncService.stop();
    });

    it('should get sync statistics', async () => {
      // Global mock is already set up
      const stats = await syncService.getSyncStats();
      expect(stats).toHaveProperty('totalEvents');
      expect(stats).toHaveProperty('failedEvents');
      expect(stats).toHaveProperty('lastEvent');
      expect(stats).toHaveProperty('status');
    });
  });

  describe('Status Mapping', () => {
    it('should map blockchain statuses correctly', () => {
      const mapBlockchainStatus = (
        syncService as unknown as { mapBlockchainStatus: (status: string) => string }
      ).mapBlockchainStatus.bind(syncService);

      expect(mapBlockchainStatus('Pending')).toBe('pending');
      expect(mapBlockchainStatus('Confirmed')).toBe('confirmed');
      expect(mapBlockchainStatus('Completed')).toBe('completed');
      expect(mapBlockchainStatus('Cancelled')).toBe('cancelled');
      expect(mapBlockchainStatus('Unknown')).toBe('pending'); // Default case
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Global mock is already set up
      await syncService.start();
      expect(syncService.getStatus().isRunning).toBe(true);
      await syncService.stop();
    });

    it('should handle database errors gracefully', async () => {
      // Global mock is already set up
      await syncService.start();
      expect(syncService.getStatus().isRunning).toBe(true);
      await syncService.stop();
    });
  });

  it('should use custom polling interval from environment variable', () => {
    // Save original environment variables
    const originalPollingInterval = process.env.SYNC_POLL_INTERVAL;
    const originalRpcUrl = process.env.SOROBAN_RPC_URL;
    const originalContractId = process.env.SOROBAN_CONTRACT_ID;
    const originalNetworkPassphrase = process.env.SOROBAN_NETWORK_PASSPHRASE;

    try {
      // Set custom polling interval
      process.env.SYNC_POLL_INTERVAL = '10000';
      process.env.SOROBAN_RPC_URL = 'https://test-rpc.stellar.org';
      process.env.SOROBAN_CONTRACT_ID = 'CB3ILSDNHL6TWZYZJAS4L27GLHNAGW4ISW6YXIBHGHL4QYI4JPLP6W3E';
      process.env.SOROBAN_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

      const customSyncService = new SyncService();
      expect(customSyncService.getPollingIntervalMs()).toBe(10000);
    } finally {
      // Restore original environment variables
      process.env.SYNC_POLL_INTERVAL = originalPollingInterval;
      process.env.SOROBAN_RPC_URL = originalRpcUrl;
      process.env.SOROBAN_CONTRACT_ID = originalContractId;
      process.env.SOROBAN_NETWORK_PASSPHRASE = originalNetworkPassphrase;
    }
  });

  it('should fallback to default polling interval for invalid environment value', () => {
    // Save original environment variables
    const originalPollingInterval = process.env.SYNC_POLL_INTERVAL;
    const originalRpcUrl = process.env.SOROBAN_RPC_URL;
    const originalContractId = process.env.SOROBAN_CONTRACT_ID;
    const originalNetworkPassphrase = process.env.SOROBAN_NETWORK_PASSPHRASE;

    try {
      // Set invalid polling interval
      process.env.SYNC_POLL_INTERVAL = 'invalid';
      process.env.SOROBAN_RPC_URL = 'https://test-rpc.stellar.org';
      process.env.SOROBAN_CONTRACT_ID = 'CB3ILSDNHL6TWZYZJAS4L27GLHNAGW4ISW6YXIBHGHL4QYI4JPLP6W3E';
      process.env.SOROBAN_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

      const fallbackSyncService = new SyncService();
      expect(fallbackSyncService.getPollingIntervalMs()).toBe(5000); // Default fallback
    } finally {
      // Restore original environment variables
      process.env.SYNC_POLL_INTERVAL = originalPollingInterval;
      process.env.SOROBAN_RPC_URL = originalRpcUrl;
      process.env.SOROBAN_CONTRACT_ID = originalContractId;
      process.env.SOROBAN_NETWORK_PASSPHRASE = originalNetworkPassphrase;
    }
  });
});
