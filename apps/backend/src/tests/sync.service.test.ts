import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

// Mock Supabase
const mockSupabase = {
  from: mock(() => ({
    select: mock(() => ({
      single: mock(() => Promise.resolve({ data: null, error: null })),
      eq: mock(() => ({
        single: mock(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    insert: mock(() => Promise.resolve({ data: null, error: null })),
    update: mock(() => ({
      eq: mock(() => Promise.resolve({ data: null, error: null })),
    })),
    upsert: mock(() => Promise.resolve({ data: null, error: null })),
    delete: mock(() => Promise.resolve({ data: null, error: null })),
  })),
};

// Mock the supabase module
mock.module('../config/supabase', () => ({
  supabase: mockSupabase,
}));

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
    } catch (error) {
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
        process.env.SOROBAN_CONTRACT_ID = 'test-contract-id';
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
        process.env.SOROBAN_CONTRACT_ID = 'test-contract-id';
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
      // Mock successful initialization
      const mockSupabase = supabase as jest.Mocked<typeof supabase>;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      } as unknown as ReturnType<typeof supabase.from>);

      await syncService.start();
      expect(syncService.getStatus().isRunning).toBe(true);

      await syncService.stop();
      expect(syncService.getStatus().isRunning).toBe(false);
    });

    it('should not start service twice', async () => {
      const mockSupabase = supabase as jest.Mocked<typeof supabase>;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      } as unknown as ReturnType<typeof supabase.from>);

      await syncService.start();
      await syncService.start(); // Should not start again

      expect(syncService.getStatus().isRunning).toBe(true);
    });

    it('should not stop service twice', async () => {
      const mockSupabase = supabase as jest.Mocked<typeof supabase>;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      } as unknown as ReturnType<typeof supabase.from>);

      await syncService.start();
      await syncService.stop();
      await syncService.stop(); // Should not stop again

      expect(syncService.getStatus().isRunning).toBe(false);
    });
  });

  describe('Event Processing', () => {
    it('should process booking created event', async () => {
      const mockSupabase = supabase as jest.Mocked<typeof supabase>;

      // Mock sync state
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: { last_processed_block: 100 },
              error: null,
            })
          ),
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      } as unknown as ReturnType<typeof supabase.from>);

      const event = {
        id: 'test-event-1',
        type: 'booking_created',
        bookingId: 'booking-123',
        propertyId: 'property-456',
        userId: 'user-789',
        timestamp: new Date(),
        data: {
          escrow_id: 'escrow-123',
          property_id: 'property-456',
          user_id: 'user-789',
          start_date: Math.floor(Date.now() / 1000),
          end_date: Math.floor(Date.now() / 1000) + 86400,
          total_price: 1000,
          status: 'Pending',
        },
      };

      // Mock existing booking check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      } as unknown as ReturnType<typeof supabase.from>);

      // Mock booking creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      } as unknown as ReturnType<typeof supabase.from>);

      await syncService.start();

      // Simulate event processing
      const processEventMethod = (
        syncService as unknown as {
          processEvent: (event: Record<string, unknown>) => Promise<void>;
        }
      ).processEvent.bind(syncService);
      await processEventMethod(event);

      expect(mockSupabase.from).toHaveBeenCalledWith('sync_events');
      expect(mockSupabase.from).toHaveBeenCalledWith('bookings');
    });

    it('should handle event processing errors gracefully', async () => {
      const mockSupabase = supabase as jest.Mocked<typeof supabase>;

      // Mock sync state
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: { last_processed_block: 100 },
              error: null,
            })
          ),
        })),
        insert: jest.fn(() => Promise.reject(new Error('Database error'))),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      } as unknown as ReturnType<typeof supabase.from>);

      const event = {
        id: 'test-event-2',
        type: 'booking_created',
        bookingId: 'booking-123',
        propertyId: 'property-456',
        userId: 'user-789',
        timestamp: new Date(),
        data: {},
      };

      await syncService.start();

      // Simulate event processing
      const processEventMethod = (
        syncService as unknown as {
          processEvent: (event: Record<string, unknown>) => Promise<void>;
        }
      ).processEvent.bind(syncService);

      // Should throw error due to database failure
      await expect(processEventMethod(event)).rejects.toThrow('Database error');

      // Failed events count remains unchanged since the error is thrown before marking as failed
      expect(syncService.getStatus().failedEvents).toBe(0);
    });
  });

  describe('Manual Operations', () => {
    it('should trigger manual sync', async () => {
      const mockSupabase = supabase as jest.Mocked<typeof supabase>;

      // Mock database operations for sync state and events
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      } as unknown as ReturnType<typeof supabase.from>);

      // Mock blockchain responses
      const mockFetch = jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ sequence: 1000 }),
        } as Response) // getLatestLedger response
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ events: [] }),
        } as Response); // getContractEvents response (empty for this test)

      await syncService.start();

      // Capture initial state
      const initialStatus = syncService.getStatus();
      const initialLastProcessedBlock = initialStatus.lastProcessedBlock;

      // Trigger manual sync (this will call the real pollForEvents method)
      await syncService.triggerManualSync();

      // Verify the service is still running
      expect(syncService.getStatus().isRunning).toBe(true);

      // Verify that blockchain operations were called
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/getLatestLedger'));

      // Verify that database operations were called for sync state update
      expect(mockSupabase.from).toHaveBeenCalledWith('sync_state');

      // Verify that the sync state was updated
      const finalStatus = syncService.getStatus();
      expect(finalStatus.lastProcessedBlock).toBe(1000); // Should be updated to current block height
      expect(finalStatus.lastSyncTime).toBeInstanceOf(Date);
    });

    it('should process blockchain events during manual sync', async () => {
      const mockSupabase = supabase as jest.Mocked<typeof supabase>;

      // Mock database operations
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      } as unknown as ReturnType<typeof supabase.from>);

      // Mock blockchain responses with actual events
      const mockFetch = jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ sequence: 1001 }),
        } as Response) // getLatestLedger response
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              events: [
                {
                  id: 'event-1',
                  type: 'booking_created',
                  bookingId: 'booking-123',
                  propertyId: 'property-456',
                  userId: 'user-789',
                  timestamp: new Date().toISOString(),
                  data: { amount: 1000, status: 'Pending' },
                },
              ],
            }),
        } as Response); // getContractEvents response with mock events

      await syncService.start();

      // Capture initial state
      const initialStatus = syncService.getStatus();
      const initialTotalEvents = initialStatus.totalEventsProcessed;

      // Trigger manual sync
      await syncService.triggerManualSync();

      // Verify blockchain operations were called
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/getLatestLedger'));

      // Verify database operations for events and sync state
      expect(mockSupabase.from).toHaveBeenCalledWith('sync_events');
      expect(mockSupabase.from).toHaveBeenCalledWith('sync_state');

      // Verify sync state was updated
      const finalStatus = syncService.getStatus();
      expect(finalStatus.lastProcessedBlock).toBe(1001);
      expect(finalStatus.lastSyncTime).toBeInstanceOf(Date);
      expect(finalStatus.totalEventsProcessed).toBeGreaterThan(initialTotalEvents);
    });

    it('should handle blockchain errors during manual sync', async () => {
      const mockSupabase = supabase as jest.Mocked<typeof supabase>;

      // Mock database operations
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      } as unknown as ReturnType<typeof supabase.from>);

      // Mock blockchain error
      const mockFetch = jest
        .spyOn(global, 'fetch')
        .mockRejectedValueOnce(new Error('Blockchain connection failed'));

      await syncService.start();

      // Capture initial state
      const initialStatus = syncService.getStatus();
      const initialFailedEvents = initialStatus.failedEvents;

      // Trigger manual sync (should handle error gracefully)
      await syncService.triggerManualSync();

      // Verify blockchain operation was attempted
      expect(mockFetch).toHaveBeenCalled();

      // Verify error was handled gracefully
      const finalStatus = syncService.getStatus();
      expect(finalStatus.isRunning).toBe(true); // Service should still be running
      expect(finalStatus.failedEvents).toBeGreaterThan(initialFailedEvents); // Should increment failed events
    });

    it('should get sync statistics', async () => {
      const mockSupabase = supabase as jest.Mocked<typeof supabase>;

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          eq: jest.fn(() => ({
            not: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      } as unknown as ReturnType<typeof supabase.from>);

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
      // Mock network error
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as unknown as typeof fetch;

      const mockSupabase = supabase as jest.Mocked<typeof supabase>;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      } as unknown as ReturnType<typeof supabase.from>);

      await syncService.start();

      // Should not crash the service
      expect(syncService.getStatus().isRunning).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      const mockSupabase = supabase as jest.Mocked<typeof supabase>;

      // Mock database error
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.reject(new Error('Database error'))),
        })),
      } as unknown as ReturnType<typeof supabase.from>);

      await syncService.start();

      // Should not crash the service
      expect(syncService.getStatus().isRunning).toBe(true);
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
      process.env.SOROBAN_CONTRACT_ID = 'test-contract-id';
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
      process.env.SOROBAN_CONTRACT_ID = 'test-contract-id';
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
