import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { Response } from 'express';
import type { AuthRequest } from '../../src/types/auth.types';
import { BookingError } from '../../src/types/common.types';

// Mock the booking service
const mockCreateBooking = mock(() => Promise.resolve({}));
const mockCancelBooking = mock(() => Promise.resolve({}));
const mockUpdateBookingStatus = mock(() => Promise.resolve({}));

mock.module('../../src/services/booking.service', () => ({
  bookingService: {
    createBooking: mockCreateBooking,
    cancelBooking: mockCancelBooking,
    updateBookingStatus: mockUpdateBookingStatus,
  },
}));

// Mock blockchain contract
const mockCheckBookingAvailability = mock(() => Promise.resolve(true));

mock.module('../../src/blockchain/bookingContract', () => ({
  checkBookingAvailability: mockCheckBookingAvailability,
}));

// Mock supabase
const mockSupabaseQuery = mock(() => Promise.resolve({ data: [], error: null, count: 0 }));

mock.module('../../src/config/supabase', () => ({
  supabase: {
    from: mock(() => ({
      select: mock(() => ({
        eq: mock(() => ({
          order: mock(() => ({
            range: mock(() => mockSupabaseQuery()),
          })),
        })),
      })),
    })),
  },
}));

import {
  cancelBooking,
  checkPropertyAvailability,
  getUserBookings,
  postBooking,
  updateBookingStatus,
} from '../../src/controllers/booking.controller';

describe('Booking Controllers', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  const testUserId = 'user-123';
  const testBookingId = '123e4567-e89b-12d3-a456-426614174000';
  const testPropertyId = '123e4567-e89b-12d3-a456-426614174001';

  beforeEach(() => {
    mockCreateBooking.mockClear();
    mockCancelBooking.mockClear();
    mockUpdateBookingStatus.mockClear();
    mockCheckBookingAvailability.mockClear();
    mockSupabaseQuery.mockClear();

    req = {
      user: {
        id: testUserId,
        // biome-ignore lint/suspicious/noExplicitAny: Test mock object
        app_metadata: {} as any,
        // biome-ignore lint/suspicious/noExplicitAny: Test mock object
        user_metadata: {} as any,
        aud: '',
        created_at: '',
      },
      body: {},
      params: {},
      query: {},
    };

    res = {
      // biome-ignore lint/suspicious/noExplicitAny: Test mock function
      status: mock(() => res) as any,
      // biome-ignore lint/suspicious/noExplicitAny: Test mock function
      json: mock(() => {}) as any,
    };
  });

  describe('postBooking', () => {
    it('should create booking successfully', async () => {
      req.body = {
        propertyId: testPropertyId,
        userId: testUserId,
        dates: { from: '2025-06-01', to: '2025-06-05' },
        guests: 2,
        total: 200,
        deposit: 50,
      };

      mockCreateBooking.mockResolvedValue({
        bookingId: testBookingId,
        escrowAddress: 'escrow-123',
        status: 'pending',
      });

      await postBooking(req as AuthRequest, res as Response, () => {});

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          bookingId: testBookingId,
          escrowAddress: 'escrow-123',
          status: 'pending',
        },
        message: 'Booking created successfully',
      });
    });

    it('should handle booking creation failure', async () => {
      req.body = { propertyId: testPropertyId, userId: testUserId };

      mockCreateBooking.mockRejectedValue(
        new BookingError('Property is not available', 'UNAVAILABLE')
      );

      await postBooking(req as AuthRequest, res as Response, () => {});

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        error: {
          message: 'Property is not available',
          details: null,
        },
      });
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking successfully', async () => {
      req.params = { bookingId: testBookingId };

      mockCancelBooking.mockResolvedValue({
        success: true,
        message: 'Booking cancelled successfully',
      });

      await cancelBooking(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          success: true,
          message: 'Booking cancelled successfully',
        },
        message: 'Booking cancelled successfully',
      });
    });

    it('should handle booking not found', async () => {
      req.params = { bookingId: testBookingId };

      mockCancelBooking.mockRejectedValue(new BookingError('Booking not found', 'NOT_FOUND'));

      await cancelBooking(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        error: {
          message: 'Booking not found',
          details: null,
        },
      });
    });
  });

  describe('getUserBookings', () => {
    it('should get user bookings successfully', async () => {
      req.query = { page: '1', limit: '10' };

      const mockBookings = [{ id: testBookingId, status: 'pending' }];

      mockSupabaseQuery.mockResolvedValue({
        data: mockBookings,
        error: null,
        count: 1,
      });

      await getUserBookings(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          bookings: mockBookings,
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        },
      });
    });
  });

  describe('checkPropertyAvailability', () => {
    it('should check availability successfully', async () => {
      req.params = { propertyId: testPropertyId };
      req.query = { from: '2025-06-01', to: '2025-06-05' };

      mockCheckBookingAvailability.mockResolvedValue(true);

      await checkPropertyAvailability(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          propertyId: testPropertyId,
          isAvailable: true,
          dates: {
            from: '2025-06-01',
            to: '2025-06-05',
          },
        },
      });
    });
  });

  describe('updateBookingStatus', () => {
    it('should update booking status successfully', async () => {
      req.params = { bookingId: testBookingId };
      req.body = { status: 'confirmed' };

      mockUpdateBookingStatus.mockResolvedValue({
        success: true,
        booking: { id: testBookingId, status: 'confirmed' },
      });

      await updateBookingStatus(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          success: true,
          booking: { id: testBookingId, status: 'confirmed' },
        },
        message: 'Booking status updated successfully',
      });
    });

    it('should handle unauthorized status update', async () => {
      req.params = { bookingId: testBookingId };
      req.body = { status: 'confirmed' };

      mockUpdateBookingStatus.mockRejectedValue(new BookingError('Unauthorized', 'UNAUTHORIZED'));

      await updateBookingStatus(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        error: {
          message: 'Unauthorized',
          details: null,
        },
      });
    });
  });
});
