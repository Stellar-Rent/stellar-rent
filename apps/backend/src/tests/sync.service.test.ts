import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { supabase } from '../config/supabase';
import { syncService } from '../services/sync.service';

// Mock Supabase
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      const originalRpcUrl = process.env.SOROBAN_RPC_URL;
      const originalContractId = process.env.SOROBAN_CONTRACT_ID;
      process.env.SOROBAN_RPC_URL = undefined;
      process.env.SOROBAN_CONTRACT_ID = undefined;

      expect(() => {
        new (require('../services/sync.service').SyncService)();
      }).toThrow('Missing required environment variables for sync service');
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

      // Should not throw error
      await expect(processEventMethod(event)).resolves.not.toThrow();

      // Should increment failed events count
      expect(syncService.getStatus().failedEvents).toBeGreaterThan(0);
    });
  });

  describe('Manual Operations', () => {
    it('should trigger manual sync', async () => {
      const mockSupabase = supabase as jest.Mocked<typeof supabase>;

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      } as unknown as ReturnType<typeof supabase.from>);

      await syncService.start();

      // Mock successful polling
      const pollForEventsMethod = (
        syncService as unknown as { pollForEvents: () => Promise<void> }
      ).pollForEvents.bind(syncService);
      jest
        .spyOn(syncService as unknown as { pollForEvents: () => Promise<void> }, 'pollForEvents')
        .mockResolvedValue(undefined);

      await syncService.triggerManualSync();

      expect(syncService.getStatus().isRunning).toBe(true);
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
});
