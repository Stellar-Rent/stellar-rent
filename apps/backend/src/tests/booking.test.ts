import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createBooking } from '../services/booking.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkAvailability } from '../blockchain/soroban';
import { createEscrow, TrustlessWorkClient } from '../blockchain/trustlessWork';
import { supabase } from '../config/supabase';
import type { CreateBookingInput } from '../types/booking.types';
import type { AuthRequest } from '../types/auth.types';

// Mock external dependencies
const mockCheckAvailability = mock();
const mockCreateEscrow = mock();
const mockSupabase = {
  from: mock()
};
const mockJwt = {
  verify: mock()
};

// Replace the actual modules with mocks
mock.module('../blockchain/soroban', () => ({
  checkAvailability: mockCheckAvailability
}));

mock.module('../blockchain/trustlessWork', () => ({
  createEscrow: mockCreateEscrow,
  TrustlessWorkClient: class MockTrustlessWorkClient {
    constructor(apiUrl?: string, apiKey?: string) {
      if (!apiKey && !process.env.TRUSTLESS_WORK_API_KEY) {
        throw new Error('TrustlessWork API key is required');
      }
    }
    
    async createEscrow(request: any) {
      if (!request.buyer) {
        throw new Error('Validation errors: Invalid buyer Stellar address');
      }
      if (request.buyer === 'invalid-stellar-address') {
        throw new Error('Invalid buyer Stellar address');
      }
      if (request.amount === '0') {
        throw new Error('Validation errors: Amount must be greater than 0');
      }
      return mockCreateEscrow();
    }
  }
}));

mock.module('../config/supabase', () => ({
  supabase: mockSupabase
}));

mock.module('jsonwebtoken', () => mockJwt);

describe('Booking Service Tests', () => {
  beforeEach(() => {
    // Clear all mocks
    mockCheckAvailability.mockClear();
    mockCreateEscrow.mockClear();
    mockSupabase.from.mockClear();
    mockJwt.verify.mockClear();
    
    // Set up environment variables
    process.env.JWT_SECRET = 'test-secret';
    process.env.STELLAR_NETWORK = 'testnet';
    process.env.TRUSTLESS_WORK_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    // Reset all mocks
    mockCheckAvailability.mockReset();
    mockCreateEscrow.mockReset();
    mockSupabase.from.mockReset();
    mockJwt.verify.mockReset();
  });

  describe('Successful Booking Creation', () => {
    it('should create a booking successfully with valid data', async () => {
      // Arrange
      const mockBookingData: CreateBookingInput = {
        propertyId: 'property-123',
        userId: 'GCKFBEIYTKP6RCZNVPH73XJ7UJUYRT5B7DQMWSQG4RMZWQTCAKMZ5QJA',
        dates: {
          from: new Date('2025-07-01'),
          to: new Date('2025-07-07'),
        },
        guests: 2,
        total: 1000,
        deposit: 200,
      };

      const mockEscrowAddress = 'ESCROW_ADDRESS_123';
      const mockBookingResponse = {
        id: 'booking-456',
        property_id: 'property-123',
        user_id: 'GCKFBEIYTKP6RCZNVPH73XJ7UJUYRT5B7DQMWSQG4RMZWQTCAKMZ5QJA',
        status: 'pending',
        escrow_address: mockEscrowAddress,
      };

      // Mock successful availability check
      mockCheckAvailability.mockResolvedValue({
        isAvailable: true,
      });

      // Mock successful escrow creation
      mockCreateEscrow.mockResolvedValue(mockEscrowAddress);

      // Mock successful database insertion
      mockSupabase.from.mockReturnValue({
        insert: mock().mockReturnValue({
          select: mock().mockReturnValue({
            single: mock().mockResolvedValue({
              data: mockBookingResponse,
              error: null,
            }),
          }),
        }),
      });

      // Act
      const result = await createBooking(mockBookingData);

      // Assert
      expect(mockCheckAvailability).toHaveBeenCalledWith({
        propertyId: 'property-123',
        dates: {
          from: new Date('2025-07-01'),
          to: new Date('2025-07-07'),
        },
      });

      expect(mockCreateEscrow).toHaveBeenCalledWith({
        buyerAddress: 'GCKFBEIYTKP6RCZNVPH73XJ7UJUYRT5B7DQMWSQG4RMZWQTCAKMZ5QJA',
        propertyId: 'property-123',
        totalAmount: 1000,
        depositAmount: 200,
        dates: {
          from: new Date('2025-07-01'),
          to: new Date('2025-07-07'),
        },
        bookingId: '',
        sellerAddress: '',
        guests: 0,
        propertyTitle: '',
      });

      expect(result).toEqual({
        bookingId: 'booking-456',
        escrowAddress: mockEscrowAddress,
        status: 'pending',
      });
    });
  });

  describe('Authentication Tests', () => {
    let mockReq: Partial<AuthRequest>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        headers: {},
      };
      mockRes = {
        status: mock().mockReturnThis(),
        json: mock(),
      };
      mockNext = mock();
    });

    it('should fail when no authorization header is provided', () => {
      // Arrange
      mockReq.headers = {};

      // Act
      authenticateToken(mockReq as AuthRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Token no proporcionado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail when authorization header has no token', () => {
      // Arrange
      mockReq.headers = {
        authorization: 'Bearer',
      };

      // Act
      authenticateToken(mockReq as AuthRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Token no proporcionado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail when token is invalid', () => {
      // Arrange
      mockReq.headers = {
        authorization: 'Bearer invalid-token',
      };
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      authenticateToken(mockReq as AuthRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Token inválido o expirado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should succeed with valid token', () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockReq.headers = {
        authorization: 'Bearer valid-token',
      };
      mockJwt.verify.mockReturnValue(mockUser);

      // Act
      authenticateToken(mockReq as AuthRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should throw error when JWT_SECRET is not set', () => {
      // Arrange
      process.env.JWT_SECRET = undefined;
      mockReq.headers = {
        authorization: 'Bearer valid-token',
      };

      // Act & Assert
      expect(() => {
        authenticateToken(mockReq as AuthRequest, mockRes as Response, mockNext);
      }).toThrow('JWT_SECRET environment variable is required');
    });
  });

  describe('Validation Error Tests', () => {
    it('should fail when property is not available', async () => {
      // Arrange
      const mockBookingData: CreateBookingInput = {
        propertyId: 'property-123',
        userId: 'GCKFBEIYTKP6RCZNVPH73XJ7UJUYRT5B7DQMWSQG4RMZWQTCAKMZ5QJA',
        dates: {
          from: new Date('2025-07-01'),
          to: new Date('2025-07-07'),
        },
        guests: 2,
        total: 1000,
        deposit: 200,
      };

      mockCheckAvailability.mockResolvedValue({
        isAvailable: false,
        conflictingBookings: [
          {
            bookingId: 'existing-booking',
            dates: {
              from: new Date('2025-07-03'),
              to: new Date('2025-07-05'),
            },
          },
        ],
      });

      // Act & Assert
      await expect(createBooking(mockBookingData)).rejects.toMatchObject({
        message: 'Property is not available for the selected dates',
        code: 'UNAVAILABLE',
      });

      expect(mockCreateEscrow).not.toHaveBeenCalled();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should validate invalid date ranges in Soroban availability check', async () => {
      // Arrange - Mock past date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      mockCheckAvailability.mockRejectedValue(
        new Error('Start date must be in the future')
      );

      const mockBookingData: CreateBookingInput = {
        propertyId: 'property-123',
        userId: 'GCKFBEIYTKP6RCZNVPH73XJ7UJUYRT5B7DQMWSQG4RMZWQTCAKMZ5QJA',
        dates: {
          from: pastDate,
          to: new Date('2025-07-07'),
        },
        guests: 2,
        total: 1000,
        deposit: 200,
      };

      // Act & Assert
      await expect(createBooking(mockBookingData)).rejects.toThrow(
        'Start date must be in the future'
      );
    });

    it('should validate end date after start date in Soroban', async () => {
      // Arrange
      mockCheckAvailability.mockRejectedValue(
        new Error('End date must be after start date')
      );

      const mockBookingData: CreateBookingInput = {
        propertyId: 'property-123',
        userId: 'GCKFBEIYTKP6RCZNVPH73XJ7UJUYRT5B7DQMWSQG4RMZWQTCAKMZ5QJA',
        dates: {
          from: new Date('2025-07-07'),
          to: new Date('2025-07-01'), // End before start
        },
        guests: 2,
        total: 1000,
        deposit: 200,
      };

      // Act & Assert
      await expect(createBooking(mockBookingData)).rejects.toThrow(
        'End date must be after start date'
      );
    });
  });

  // Additional test suites would follow the same pattern...
  // Converting all the remaining Jest tests to Bun format
});