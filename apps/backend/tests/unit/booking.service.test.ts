import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { supabase } from '../../src/config/supabase';
import { BookingService } from '../../src/services/booking.service';
import type { BlockchainServices } from '../../src/services/booking.service';
import { loggingService } from '../../src/services/logging.service';
import { getPropertyById } from '../../src/services/property.service';
import type { ConflictingBooking, CreateBookingInput } from '../../src/types/booking.types';
import { BookingError } from '../../src/types/common.types';
import type { TransactionLog } from '../../src/types/common.types';

// Mock external dependencies
mock.module('../../src/services/logging.service', () => ({
  loggingService: {
    logBlockchainOperation: mock(() => mockTransactionLog),
    logBlockchainSuccess: mock(() => {}),
    logBlockchainError: mock(() => {}),
  },
}));

mock.module('../../src/services/property.service', () => ({
  getPropertyById: mock(() =>
    Promise.resolve({
      success: true,
      data: { ownerId: 'owner-123', title: 'Test Property' },
    })
  ),
}));

mock.module('../../src/config/supabase', () => ({
  supabase: {
    from: mock(() => ({
      select: mock(() => ({
        eq: mock(() => ({
          single: mock(() =>
            Promise.resolve({
              data: { stellar_address: 'GOWNER123' },
              error: null,
            })
          ),
        })),
      })),
      insert: mock(() => ({
        select: mock(() => ({
          single: mock(() =>
            Promise.resolve({
              data: mockBookingRecord,
              error: null,
            })
          ),
        })),
      })),
      update: mock(() => ({
        eq: mock(() => ({
          select: mock(() => ({
            single: mock(() =>
              Promise.resolve({
                data: { ...mockBookingRecord, status: 'cancelled' },
                error: null,
              })
            ),
          })),
        })),
      })),
    })),
  },
}));

// Test data
const validBookingInput: CreateBookingInput = {
  propertyId: '123e4567-e89b-12d3-a456-426614174000',
  userId: '123e4567-e89b-12d3-a456-426614174001',
  dates: {
    from: new Date('2025-06-01'),
    to: new Date('2025-06-05'),
  },
  guests: 2,
  total: 200,
  deposit: 50,
};

const mockBookingRecord = {
  id: 'booking-123',
  property_id: validBookingInput.propertyId,
  user_id: validBookingInput.userId,
  dates: {
    from: validBookingInput.dates.from.toISOString(),
    to: validBookingInput.dates.to.toISOString(),
  },
  guests: validBookingInput.guests,
  total: validBookingInput.total,
  deposit: validBookingInput.deposit,
  escrow_address: 'escrow-123',
  blockchain_booking_id: 'blockchain-123',
  status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockTransactionLog: TransactionLog = {
  timestamp: new Date().toISOString(),
  operation: 'createBooking',
  status: 'started',
  details: validBookingInput,
};

const conflictingBookings: ConflictingBooking[] = [
  {
    bookingId: 'existing-booking-123',
    dates: {
      from: new Date('2025-06-02'),
      to: new Date('2025-06-04'),
    },
  },
];

describe('BookingService Unit Tests', () => {
  let bookingService: BookingService;
  let mockBlockchainServices: BlockchainServices;

  beforeEach(() => {
    // Create fresh mock blockchain services for each test
    mockBlockchainServices = {
      checkAvailability: mock(() =>
        Promise.resolve({
          isAvailable: true,
          conflictingBookings: [],
        })
      ),
      createEscrow: mock(() => Promise.resolve('escrow-123')),
      cancelEscrow: mock(() => Promise.resolve()),
    };

    bookingService = new BookingService(mockBlockchainServices);
  });

  describe('createBooking', () => {
    it('should successfully create a booking with all steps', async () => {
      const result = await bookingService.createBooking(validBookingInput);

      expect(result).toEqual({
        bookingId: 'booking-123',
        escrowAddress: 'escrow-123',
        status: 'pending',
      });

      expect(mockBlockchainServices.checkAvailability).toHaveBeenCalledWith({
        propertyId: validBookingInput.propertyId,
        dates: validBookingInput.dates,
      });
      expect(mockBlockchainServices.createEscrow).toHaveBeenCalled();
    });

    it('should throw BookingError when property is unavailable', async () => {
      mockBlockchainServices.checkAvailability = mock(() =>
        Promise.resolve({
          isAvailable: false,
          conflictingBookings,
        })
      );

      await expect(bookingService.createBooking(validBookingInput)).rejects.toThrow(
        new BookingError(
          'Property is not available for the selected dates',
          'UNAVAILABLE',
          conflictingBookings
        )
      );
    });

    it('should handle escrow creation failure', async () => {
      const escrowError = new Error('Escrow creation failed');
      mockBlockchainServices.createEscrow = mock(() => Promise.reject(escrowError));

      await expect(bookingService.createBooking(validBookingInput)).rejects.toThrow(BookingError);
    });

    it('should rollback escrow when blockchain booking fails', async () => {
      const blockchainError = new Error('Blockchain booking failed');

      // Mock blockchain contract function to fail
      mock.module('../../src/blockchain/bookingContract', () => ({
        createBookingOnChain: mock(() => Promise.reject(blockchainError)),
      }));

      await expect(bookingService.createBooking(validBookingInput)).rejects.toThrow(BookingError);

      expect(mockBlockchainServices.cancelEscrow).toHaveBeenCalledWith('escrow-123');
    });

    it('should rollback both escrow and blockchain when database fails', async () => {
      // Mock successful blockchain booking creation
      mock.module('../../src/blockchain/bookingContract', () => ({
        createBookingOnChain: mock(() => Promise.resolve('blockchain-123')),
        cancelBookingOnChain: mock(() => Promise.resolve()),
      }));

      // Mock database error
      supabase.from = mock(() => ({
        insert: mock(() => ({
          select: mock(() => ({
            single: mock(() =>
              Promise.resolve({
                data: null,
                error: new Error('Database error'),
              })
            ),
          })),
        })),
        // biome-ignore lint/suspicious/noExplicitAny: Test mock object
      })) as any;

      await expect(bookingService.createBooking(validBookingInput)).rejects.toThrow(
        new BookingError('Failed to create booking record', 'DB_FAIL')
      );

      expect(mockBlockchainServices.cancelEscrow).toHaveBeenCalledWith('escrow-123');
    });

    it('should handle rollback errors gracefully', async () => {
      const rollbackError = new Error('Rollback failed');
      mockBlockchainServices.cancelEscrow = mock(() => Promise.reject(rollbackError));

      // Mock database error to trigger rollback
      supabase.from = mock(() => ({
        insert: mock(() => ({
          select: mock(() => ({
            single: mock(() =>
              Promise.resolve({
                data: null,
                error: new Error('Database error'),
              })
            ),
          })),
        })),
        // biome-ignore lint/suspicious/noExplicitAny: Test mock object
      })) as any;

      await expect(bookingService.createBooking(validBookingInput)).rejects.toThrow(BookingError);

      expect(loggingService.logBlockchainError).toHaveBeenCalled();
    });
  });

  describe('cancelBooking', () => {
    const bookingId = 'booking-123';
    const userId = 'user-123';

    beforeEach(() => {
      // Mock successful booking fetch
      supabase.from = mock(() => ({
        select: mock(() => ({
          eq: mock(() => ({
            single: mock(() =>
              Promise.resolve({
                data: {
                  id: bookingId,
                  user_id: userId,
                  property_id: 'property-123',
                  blockchain_booking_id: 'blockchain-123',
                  escrow_address: 'escrow-123',
                  status: 'pending',
                },
                error: null,
              })
            ),
          })),
        })),
        update: mock(() => ({
          eq: mock(() => ({
            select: mock(() => ({
              single: mock(() =>
                Promise.resolve({
                  data: { status: 'cancelled', cancelled_at: new Date().toISOString() },
                  error: null,
                })
              ),
            })),
          })),
        })),
        // biome-ignore lint/suspicious/noExplicitAny: Test mock object
      })) as any;
    });

    it('should successfully cancel a booking', async () => {
      const result = await bookingService.cancelBooking(bookingId, userId);

      expect(result).toEqual({
        success: true,
        message: 'Booking cancelled successfully',
      });

      expect(mockBlockchainServices.cancelEscrow).toHaveBeenCalledWith('escrow-123');
    });

    it('should throw BookingError when booking not found', async () => {
      supabase.from = mock(() => ({
        select: mock(() => ({
          eq: mock(() => ({
            single: mock(() =>
              Promise.resolve({
                data: null,
                error: new Error('Not found'),
              })
            ),
          })),
        })),
        // biome-ignore lint/suspicious/noExplicitAny: Test mock object
      })) as any;

      await expect(bookingService.cancelBooking(bookingId, userId)).rejects.toThrow(
        new BookingError('Booking not found', 'NOT_FOUND')
      );
    });

    it('should throw BookingError when user is unauthorized', async () => {
      supabase.from = mock(() => ({
        select: mock(() => ({
          eq: mock(() => ({
            single: mock(() =>
              Promise.resolve({
                data: {
                  id: bookingId,
                  user_id: 'different-user',
                  status: 'pending',
                },
                error: null,
              })
            ),
          })),
        })),
        // biome-ignore lint/suspicious/noExplicitAny: Test mock object
      })) as any;

      await expect(bookingService.cancelBooking(bookingId, userId)).rejects.toThrow(
        new BookingError('Unauthorized to cancel this booking', 'UNAUTHORIZED')
      );
    });

    it('should throw BookingError for invalid booking status', async () => {
      supabase.from = mock(() => ({
        select: mock(() => ({
          eq: mock(() => ({
            single: mock(() =>
              Promise.resolve({
                data: {
                  id: bookingId,
                  user_id: userId,
                  status: 'completed',
                },
                error: null,
              })
            ),
          })),
        })),
        // biome-ignore lint/suspicious/noExplicitAny: Test mock object
      })) as any;

      await expect(bookingService.cancelBooking(bookingId, userId)).rejects.toThrow(
        new BookingError('Cannot cancel booking with status: completed', 'INVALID_STATUS')
      );
    });

    it('should continue with database update even if blockchain cancellation fails', async () => {
      const blockchainError = new Error('Blockchain cancellation failed');

      // Mock blockchain contract function to fail
      mock.module('../../src/blockchain/bookingContract', () => ({
        cancelBookingOnChain: mock(() => Promise.reject(blockchainError)),
      }));

      const result = await bookingService.cancelBooking(bookingId, userId);

      expect(result.success).toBe(true);
      expect(loggingService.logBlockchainError).toHaveBeenCalled();
    });

    it('should continue with database update even if escrow cancellation fails', async () => {
      mockBlockchainServices.cancelEscrow = mock(() =>
        Promise.reject(new Error('Escrow cancellation failed'))
      );

      const result = await bookingService.cancelBooking(bookingId, userId);

      expect(result.success).toBe(true);
      expect(loggingService.logBlockchainError).toHaveBeenCalled();
    });
  });

  describe('updateBookingStatus', () => {
    const bookingId = 'booking-123';
    const newStatus = 'confirmed';
    const requestorId = 'user-123';

    beforeEach(() => {
      // Mock successful booking fetch and update
      supabase.from = mock(() => ({
        select: mock(() => ({
          eq: mock(() => ({
            single: mock(() =>
              Promise.resolve({
                data: {
                  id: bookingId,
                  property_id: 'property-123',
                  blockchain_booking_id: 'blockchain-123',
                  status: 'pending',
                },
                error: null,
              })
            ),
          })),
        })),
        update: mock(() => ({
          eq: mock(() => ({
            select: mock(() => ({
              single: mock(() =>
                Promise.resolve({
                  data: {
                    id: bookingId,
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                })
              ),
            })),
          })),
        })),
        // biome-ignore lint/suspicious/noExplicitAny: Test mock object
      })) as any;
    });

    it('should successfully update booking status', async () => {
      const result = await bookingService.updateBookingStatus(bookingId, newStatus, requestorId);

      expect(result).toEqual({
        success: true,
        booking: {
          id: bookingId,
          status: newStatus,
          updated_at: expect.any(String),
        },
      });
    });

    it('should throw BookingError when booking not found', async () => {
      supabase.from = mock(() => ({
        select: mock(() => ({
          eq: mock(() => ({
            single: mock(() =>
              Promise.resolve({
                data: null,
                error: new Error('Not found'),
              })
            ),
          })),
        })),
        // biome-ignore lint/suspicious/noExplicitAny: Test mock object
      })) as any;

      await expect(
        bookingService.updateBookingStatus(bookingId, newStatus, requestorId)
      ).rejects.toThrow(new BookingError('Booking not found', 'NOT_FOUND'));
    });

    it('should continue with database update even if blockchain update fails', async () => {
      const blockchainError = new Error('Blockchain update failed');

      // Mock blockchain contract function to fail
      mock.module('../../src/blockchain/bookingContract', () => ({
        updateBookingStatusOnChain: mock(() => Promise.reject(blockchainError)),
      }));

      const result = await bookingService.updateBookingStatus(bookingId, newStatus, requestorId);

      expect(result.success).toBe(true);
      expect(loggingService.logBlockchainError).toHaveBeenCalled();
    });

    it('should throw BookingError when database update fails', async () => {
      supabase.from = mock(() => ({
        select: mock(() => ({
          eq: mock(() => ({
            single: mock(() =>
              Promise.resolve({
                data: { id: bookingId, blockchain_booking_id: 'blockchain-123' },
                error: null,
              })
            ),
          })),
        })),
        update: mock(() => ({
          eq: mock(() => ({
            select: mock(() => ({
              single: mock(() =>
                Promise.resolve({
                  data: null,
                  error: new Error('Database error'),
                })
              ),
            })),
          })),
        })),
        // biome-ignore lint/suspicious/noExplicitAny: Test mock object
      })) as any;

      await expect(
        bookingService.updateBookingStatus(bookingId, newStatus, requestorId)
      ).rejects.toThrow(new BookingError('Failed to update booking status', 'DB_UPDATE_FAIL'));
    });
  });
});
