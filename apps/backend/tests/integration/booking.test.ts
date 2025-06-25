import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { AvailabilityResponse } from '../../src/blockchain/soroban';
import { supabase } from '../../src/config/supabase';
import { BookingService } from '../../src/services/booking.service';
import { loggingService } from '../../src/services/logging.service';
import type { CreateBookingInput } from '../../src/types/booking.types';
import { BookingError } from '../../src/types/common.types';
import type { TransactionLog } from '../../src/types/common.types';
import type {
  MockBlockchainServices,
  MockLoggingService,
  MockSupabaseMethods,
  TestBookingData,
} from '../../src/types/test.types';

// Mock data
const validBookingData: CreateBookingInput = {
  propertyId: '123e4567-e89b-12d3-a456-426614174000',
  userId: '123e4567-e89b-12d3-a456-426614174001',
  dates: {
    from: new Date(Date.now() + 86400000), // tomorrow
    to: new Date(Date.now() + 172800000), // day after tomorrow
  },
  guests: 2,
  total: 200,
  deposit: 50,
};

// Mock blockchain services
const createMockBlockchainServices = (): MockBlockchainServices => ({
  checkAvailability: mock(() =>
    Promise.resolve({
      isAvailable: true,
      conflictingBookings: [],
    })
  ),
  createEscrow: mock(() => Promise.resolve('test-escrow-address')),
  cancelEscrow: mock(() => Promise.resolve()),
});

// Mock Supabase response
const mockBookingData: TestBookingData = {
  id: 'test-booking-id',
  propertyId: validBookingData.propertyId,
  userId: validBookingData.userId,
  dates: validBookingData.dates,
  guests: validBookingData.guests,
  total: validBookingData.total,
  deposit: validBookingData.deposit,
  status: 'pending',
  escrowAddress: 'test-escrow-address',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock Supabase client
const createMockSupabaseMethods = (): MockSupabaseMethods => ({
  from: () => ({
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: mockBookingData, error: null }),
      }),
    }),
  }),
});

// Mock transaction log
const mockTransactionLog: TransactionLog = {
  timestamp: new Date().toISOString(),
  operation: 'createBooking',
  status: 'started',
  details: validBookingData,
};

// Mock logging service
const createMockLoggingService = (): MockLoggingService => ({
  logBlockchainOperation: mock(() => mockTransactionLog),
  logBlockchainSuccess: mock(() => {}),
  logBlockchainError: mock(() => {}),
});

describe('Booking Integration Tests', () => {
  let bookingService: BookingService;
  let mockBlockchainServices: MockBlockchainServices;

  beforeEach(() => {
    mockBlockchainServices = createMockBlockchainServices();
    Object.assign(supabase, createMockSupabaseMethods());
    Object.assign(loggingService, createMockLoggingService());
    bookingService = new BookingService(mockBlockchainServices);
  });

  describe('Successful Booking Creation', () => {
    it('should create a booking when all conditions are met', async () => {
      const result = await bookingService.createBooking(validBookingData);

      expect(result).toEqual({
        bookingId: 'test-booking-id',
        escrowAddress: 'test-escrow-address',
        status: 'pending',
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle property unavailability', async () => {
      const unavailableResponse: AvailabilityResponse = {
        isAvailable: false,
        conflictingBookings: [
          {
            bookingId: 'existing-booking-id',
            dates: {
              from: new Date(),
              to: new Date(),
            },
          },
        ],
      };

      mockBlockchainServices.checkAvailability = mock(() => Promise.resolve(unavailableResponse));

      await expect(bookingService.createBooking(validBookingData)).rejects.toThrow(
        new BookingError(
          'Property is not available for the selected dates',
          'UNAVAILABLE',
          unavailableResponse.conflictingBookings
        )
      );
    });

    it('should handle escrow creation failure', async () => {
      const escrowError = new Error('Failed to create escrow');
      mockBlockchainServices.createEscrow = mock(() => Promise.reject(escrowError));

      await expect(bookingService.createBooking(validBookingData)).rejects.toThrow(
        new BookingError('Failed to create escrow', 'ESCROW_FAIL', escrowError.message)
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database error');
      Object.assign(supabase, {
        from: () => ({
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: dbError }),
            }),
          }),
        }),
      });

      await expect(bookingService.createBooking(validBookingData)).rejects.toThrow(
        new BookingError('Failed to create booking record', 'DB_FAIL', dbError)
      );
    });
  });

  describe('Rollback Functionality', () => {
    it('should attempt to cancel escrow when database operation fails', async () => {
      const dbError = new Error('Database error');
      Object.assign(supabase, {
        from: () => ({
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: dbError }),
            }),
          }),
        }),
      });

      await expect(bookingService.createBooking(validBookingData)).rejects.toThrow(
        new BookingError('Failed to create booking record', 'DB_FAIL', dbError)
      );
    });

    it('should handle failed escrow cancellation during rollback', async () => {
      const dbError = new Error('Database error');
      const rollbackError = new Error('Failed to cancel escrow');

      mockBlockchainServices.cancelEscrow = mock(() => Promise.reject(rollbackError));

      Object.assign(supabase, {
        from: () => ({
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: dbError }),
            }),
          }),
        }),
      });

      await expect(bookingService.createBooking(validBookingData)).rejects.toThrow(
        new BookingError('Failed to create booking record', 'DB_FAIL', dbError)
      );
    });
  });
});
