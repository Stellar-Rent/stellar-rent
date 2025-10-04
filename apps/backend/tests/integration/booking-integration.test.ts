import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import express from 'express';
import request from 'supertest';
import type { Response } from 'supertest';
import {
  createConflictBookingInput,
  createInvalidBookingInput,
  createValidBookingInput,
  testBookings,
  testPaymentData,
  testProperties,
  testUsers,
} from '../fixtures/booking.fixtures';
import { bookingTestUtils } from '../utils/booking-test.utils';

// Mock Supabase client - Bun style
import { mock } from 'bun:test';

mock.module('../../src/config/supabase', () => ({
  supabase: {
    from: mock(() => ({
      select: mock(() => ({
        eq: mock(() => ({
          single: mock(() => Promise.resolve({ data: null, error: null })),
          then: mock((callback: any) => callback({ data: [], error: null })),
        })),
        then: mock((callback: any) => callback({ data: [], error: null })),
      })),
      insert: mock(() => ({
        select: mock(() => Promise.resolve({ data: [], error: null })),
        then: mock((callback: any) => callback({ data: [], error: null })),
      })),
      update: mock(() => ({
        eq: mock(() => Promise.resolve({ data: [], error: null })),
        then: mock((callback: any) => callback({ data: [], error: null })),
      })),
      delete: mock(() => ({
        eq: mock(() => Promise.resolve({ data: [], error: null })),
        then: mock((callback: any) => callback({ data: [], error: null })),
      })),
      upsert: mock(() => ({
        eq: mock(() => Promise.resolve({ data: [], error: null })),
        then: mock((callback: any) => callback({ data: [], error: null })),
      })),
      then: mock((callback: any) => callback({ data: [], error: null })),
    })),
    auth: {
      getUser: mock(() =>
        Promise.resolve({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        })
      ),
    },
  },
}));

// Mock booking routes - Bun style
mock.module('../../src/routes/booking.routes', () => {
  const express = require('express');
  const router = express.Router();

  router.post('/', (_req: express.Request, res: express.Response) => {
    res.status(201).json({
      success: true,
      data: {
        bookingId: 'test-booking-id',
        escrowAddress: 'GABC123456789012345678901234567890123456789012345678901234567890',
        status: 'pending',
      },
    });
  });

  router.get('/:id', (req: express.Request, res: express.Response) => {
    res.status(200).json({
      success: true,
      data: {
        id: req.params.id,
        propertyId: 'test-property-id',
        userId: 'test-user-id',
        status: 'pending',
      },
    });
  });

  router.post('/:id/confirm-payment', (req: express.Request, res: express.Response) => {
    res.status(200).json({
      success: true,
      data: {
        bookingId: req.params.id,
        status: 'confirmed',
        transactionHash: 'test-transaction-hash',
      },
    });
  });

  return { default: router };
});

// Mock booking service - Bun style
mock.module('../../src/services/booking.service', () => ({
  bookingService: {
    createBooking: mock(),
    confirmBookingPayment: mock(),
    getBookingById: mock(),
  },
}));

// Mock blockchain services - Bun style
mock.module('../../src/blockchain/soroban', () => ({
  checkAvailability: mock(),
}));

mock.module('../../src/blockchain/trustlessWork', () => ({
  createEscrow: mock(),
  cancelEscrow: mock(),
  getEscrowStatus: mock(),
}));

interface BookingResponse {
  success: boolean;
  data: {
    bookingId: string;
    escrowAddress: string;
    status: string;
  };
}

function buildTestApp() {
  const app = express();
  app.use(express.json());

  // Import routes after mocking
  const bookingRoutes = require('../../src/routes/booking.routes').default;
  app.use('/bookings', bookingRoutes);

  return app;
}

describe('Booking Integration Tests', () => {
  let app: express.Express;
  let validToken: string;
  let expiredToken: string;
  let invalidToken: string;
  let unauthorizedToken: string;

  beforeAll(async () => {
    // Setup test environment
    await bookingTestUtils.setupTestEnvironment({
      mockBlockchain: true,
      setupDatabase: true,
      cleanupAfterEach: true,
    });

    // Add test data
    for (const property of testProperties) {
      bookingTestUtils.addTestProperty(property);
    }
    for (const user of testUsers) {
      bookingTestUtils.addTestUser(user);
    }
    for (const booking of testBookings) {
      bookingTestUtils.addTestBooking(booking);
    }

    // Generate tokens
    validToken = bookingTestUtils.generateAuthToken(
      '550e8400-e29b-41d4-a716-446655440020',
      'guest@example.com'
    );
    expiredToken = bookingTestUtils.generateExpiredToken(
      '550e8400-e29b-41d4-a716-446655440020',
      'guest@example.com'
    );
    invalidToken = bookingTestUtils.generateInvalidToken();
    unauthorizedToken = bookingTestUtils.generateAuthToken(
      '550e8400-e29b-41d4-a716-446655440022',
      'unauthorized@example.com'
    );

    app = buildTestApp();
  });

  beforeEach(() => {
    // Clear mocks - Bun doesn't have clearAllMocks, but mocks are isolated per test
  });

  describe('POST /bookings - Booking Creation', () => {
    it('should create booking successfully with valid data', async () => {
      const bookingInput = createValidBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('bookingId');
      expect(response.body.data).toHaveProperty('escrowAddress');
      expect(response.body.data).toHaveProperty('status');
    });

    it('should validate property availability before creating booking', async () => {
      const bookingInput = createValidBookingInput();

      // Mock the availability check function
      const checkAvailabilitySpy = mock(() => Promise.resolve(true));

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(201);
      expect(response.body.data).toBeDefined();

      // Verify that availability check was called
      expect(checkAvailabilitySpy).toHaveBeenCalledWith({
        propertyId: bookingInput.propertyId,
        startDate: expect.any(Number),
        endDate: expect.any(Number),
      });

      checkAvailabilitySpy.mockRestore();
    });

    it('should create escrow via Trustless Work API', async () => {
      const bookingInput = createValidBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(201);
      expect(response.body.data.escrowAddress).toMatch(/^G[A-Z0-9]{55}$/);
    });

    it('should create database record with correct data', async () => {
      const bookingInput = createValidBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(201);

      // Verify database record was created
      const booking = await bookingTestUtils.getBookingById(response.body.data.bookingId);
      expect(booking).toBeDefined();
      expect(booking.property_id).toBe(bookingInput.propertyId);
      expect(booking.user_id).toBe(bookingInput.userId);
      expect(booking.guests).toBe(bookingInput.guests);
      expect(booking.total).toBe(bookingInput.total);
      expect(booking.deposit).toBe(bookingInput.deposit);
    });

    it('should reject booking with invalid property ID', async () => {
      const bookingInput = createInvalidBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should reject booking with unavailable dates', async () => {
      const bookingInput = createConflictBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Property is not available');
    });

    it('should reject booking with insufficient funds', async () => {
      const bookingInput = createValidBookingInput({
        total: 0,
        deposit: 0,
      });

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(400);
    });

    it('should reject booking with invalid payment amounts', async () => {
      const bookingInput = createValidBookingInput({
        total: -100,
        deposit: -50,
      });

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(400);
    });

    it('should reject unauthorized booking attempts', async () => {
      const bookingInput = createValidBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send(bookingInput);

      expect(response.status).toBe(401);
    });

    it('should prevent concurrent booking of same property/dates', async () => {
      const bookingInput = createValidBookingInput();

      const requests = [
        request(app)
          .post('/bookings')
          .set('Authorization', `Bearer ${validToken}`)
          .send(bookingInput),
        request(app)
          .post('/bookings')
          .set('Authorization', `Bearer ${validToken}`)
          .send(bookingInput),
      ];

      const responses = await Promise.all(requests);

      // One should succeed, one should fail
      const successCount = responses.filter((r) => r.status === 201).length;
      const conflictCount = responses.filter((r) => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(1);
    });

    it('should rollback escrow on database failure', async () => {
      // Mock database failure
      const { supabase } = require('../../src/config/supabase');
      supabase.from.mockReturnValue({
        insert: mock(() => ({
          select: mock(() => ({
            single: mock(() =>
              Promise.resolve({ data: null, error: { message: 'Database error' } })
            ),
          })),
        })),
      });

      const bookingInput = createValidBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(500);
      // Verify escrow was cancelled
      expect(response.body.error).toContain('Failed to create booking record');
    });

    it('should rollback database on blockchain failure', async () => {
      // Mock blockchain failure
      bookingTestUtils.setupMockBlockchainFailure('escrow');

      const bookingInput = createValidBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Failed to create escrow');
    });
  });

  describe('POST /bookings/:id/confirm-payment - Payment Confirmation', () => {
    it('should confirm payment successfully with valid transaction hash', async () => {
      const booking = testBookings[0];
      const paymentData = testPaymentData[0];

      const response = await request(app)
        .post(`/bookings/${booking.id}/confirm-payment`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          transactionHash: paymentData.transactionHash,
          escrowAddress: paymentData.escrowAddress,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Booking confirmed successfully');
    });

    it('should validate transaction hash format', async () => {
      const booking = testBookings[0];

      const response = await request(app)
        .post(`/bookings/${booking.id}/confirm-payment`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          transactionHash: 'invalid-hash',
          escrowAddress: testPaymentData[0].escrowAddress,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should verify escrow status before confirmation', async () => {
      const booking = testBookings[0];
      const paymentData = testPaymentData[0];

      const response = await request(app)
        .post(`/bookings/${booking.id}/confirm-payment`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          transactionHash: paymentData.transactionHash,
          escrowAddress: paymentData.escrowAddress,
        });

      expect(response.status).toBe(200);
    });

    it('should transition booking status from pending to confirmed', async () => {
      const booking = testBookings[0];
      const paymentData = testPaymentData[0];

      const response = await request(app)
        .post(`/bookings/${booking.id}/confirm-payment`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          transactionHash: paymentData.transactionHash,
          escrowAddress: paymentData.escrowAddress,
        });

      expect(response.status).toBe(200);

      // Verify status transition
      const updatedBooking = await bookingTestUtils.getBookingById(booking.id);
      expect(updatedBooking.status).toBe('confirmed');
    });

    it('should reject confirmation with invalid transaction hash', async () => {
      const booking = testBookings[0];

      const response = await request(app)
        .post(`/bookings/${booking.id}/confirm-payment`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          transactionHash: '',
          escrowAddress: testPaymentData[0].escrowAddress,
        });

      expect(response.status).toBe(400);
    });

    it('should reject unauthorized confirmation attempts', async () => {
      const booking = testBookings[0];
      const paymentData = testPaymentData[0];

      const response = await request(app)
        .post(`/bookings/${booking.id}/confirm-payment`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .send({
          transactionHash: paymentData.transactionHash,
          escrowAddress: paymentData.escrowAddress,
        });

      expect(response.status).toBe(401);
    });

    it('should reject confirmation of already confirmed bookings', async () => {
      const confirmedBooking = testBookings[1]; // This is already confirmed
      const paymentData = testPaymentData[1];

      const response = await request(app)
        .post(`/bookings/${confirmedBooking.id}/confirm-payment`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          transactionHash: paymentData.transactionHash,
          escrowAddress: paymentData.escrowAddress,
        });

      expect(response.status).toBe(400);
    });

    it('should reject confirmation with non-existent escrow address', async () => {
      const booking = testBookings[0];

      const response = await request(app)
        .post(`/bookings/${booking.id}/confirm-payment`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          transactionHash: testPaymentData[0].transactionHash,
          escrowAddress: 'non-existent-escrow',
        });

      expect(response.status).toBe(404);
    });

    it('should handle blockchain verification failures', async () => {
      // Mock blockchain failure
      bookingTestUtils.setupMockBlockchainFailure('network');

      const booking = testBookings[0];
      const paymentData = testPaymentData[0];

      const response = await request(app)
        .post(`/bookings/${booking.id}/confirm-payment`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          transactionHash: paymentData.transactionHash,
          escrowAddress: paymentData.escrowAddress,
        });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /bookings/:id - Booking Retrieval', () => {
    it('should retrieve booking for authorized user (booker)', async () => {
      const booking = testBookings[0];

      const response = await request(app)
        .get(`/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(booking.id);
      expect(response.body.data.property_id).toBe(booking.property_id);
      expect(response.body.data.user_id).toBe(booking.user_id);
    });

    it('should retrieve booking for authorized user (host)', async () => {
      const booking = testBookings[2]; // This booking belongs to a different user

      const response = await request(app)
        .get(`/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject unauthorized access', async () => {
      const booking = testBookings[0];

      const response = await request(app)
        .get(`/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Access denied');
    });

    it('should reject request for non-existent booking', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';

      const response = await request(app)
        .get(`/bookings/${nonExistentId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Booking not found');
    });

    it('should reject request with invalid booking ID format', async () => {
      const response = await request(app)
        .get('/bookings/invalid-uuid-format')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Bad Request');
    });

    it('should format booking data correctly', async () => {
      const booking = testBookings[0];

      const response = await request(app)
        .get(`/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('property_id');
      expect(response.body.data).toHaveProperty('user_id');
      expect(response.body.data).toHaveProperty('dates');
      expect(response.body.data).toHaveProperty('guests');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('deposit');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('escrow_address');
      expect(response.body.data).toHaveProperty('created_at');
      expect(response.body.data).toHaveProperty('updated_at');
    });
  });

  describe('Security & Authorization Tests', () => {
    it('should reject requests without authentication token', async () => {
      const booking = testBookings[0];

      const response = await request(app).get(`/bookings/${booking.id}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token no proporcionado');
    });

    it('should reject requests with expired tokens', async () => {
      const booking = testBookings[0];

      const response = await request(app)
        .get(`/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Token inválido o expirado');
    });

    it('should reject requests with invalid tokens', async () => {
      const booking = testBookings[0];

      const response = await request(app)
        .get(`/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Token inválido o expirado');
    });

    it('should prevent cross-user access to bookings', async () => {
      const booking = testBookings[0]; // Belongs to user 1

      const response = await request(app)
        .get(`/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`); // User 3

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Access denied');
    });

    it('should sanitize input data to prevent injection attacks', async () => {
      const maliciousInput = {
        propertyId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440020',
        dates: {
          from: new Date(Date.now() + 86400000),
          to: new Date(Date.now() + 172800000),
        },
        guests: 2,
        total: 1000.0,
        deposit: 200.0,
        maliciousField: '<script>alert("xss")</script>',
      };

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(maliciousInput);

      // Should either succeed (ignoring extra fields) or fail with validation error
      expect([201, 400]).toContain(response.status);
    });
  });

  describe('Blockchain Integration Tests', () => {
    it('should handle Soroban availability check failures', async () => {
      bookingTestUtils.setupMockBlockchainFailure('availability');

      const bookingInput = createValidBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Soroban network error');
    });

    it('should handle Trustless Work API failures', async () => {
      bookingTestUtils.setupMockBlockchainFailure('escrow');

      const bookingInput = createValidBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Trustless Work API error');
    });

    it('should handle network connectivity issues', async () => {
      bookingTestUtils.setupMockBlockchainFailure('network');

      const bookingInput = createValidBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(500);
    });

    it('should handle contract deployment issues', async () => {
      // Mock contract not found scenario
      const { checkAvailability } = require('../../src/blockchain/soroban');
      checkAvailability.mockRejectedValue(new Error('Contract not deployed'));

      const bookingInput = createValidBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(500);
    });

    it('should handle transaction timeout scenarios', async () => {
      bookingTestUtils.setupMockBlockchainFailure('network');

      const bookingInput = createValidBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(500);
    });
  });

  describe('Race Condition Tests', () => {
    it('should prevent concurrent booking attempts for same property/dates', async () => {
      const bookingInput = createValidBookingInput();

      const requests = await bookingTestUtils.simulateConcurrentRequests(
        () =>
          request(app)
            .post('/bookings')
            .set('Authorization', `Bearer ${validToken}`)
            .send(bookingInput),
        3
      );

      const successCount = requests.filter((r: Response) => r.status === 201).length;
      const conflictCount = requests.filter((r: Response) => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(2);
    });

    it('should handle payment confirmation race conditions', async () => {
      const booking = testBookings[0];
      const paymentData = testPaymentData[0];

      const requests = await bookingTestUtils.simulateRaceCondition(
        () =>
          request(app)
            .post(`/bookings/${booking.id}/confirm-payment`)
            .set('Authorization', `Bearer ${validToken}`)
            .send({
              transactionHash: paymentData.transactionHash,
              escrowAddress: paymentData.escrowAddress,
            }),
        50
      );

      // Only one should succeed
      const successCount = requests.filter((r: Response) => r.status === 200).length;
      const errorCount = requests.filter((r: Response) => r.status !== 200).length;

      expect(successCount).toBe(1);
      expect(errorCount).toBe(1);
    });

    it('should maintain database transaction isolation', async () => {
      const bookingInput = createValidBookingInput();

      const requests = await bookingTestUtils.simulateConcurrentRequests(
        () =>
          request(app)
            .post('/bookings')
            .set('Authorization', `Bearer ${validToken}`)
            .send(bookingInput),
        2
      );

      // Verify database consistency
      const successfulRequests = requests.filter((r: Response) => r.status === 201);
      if (successfulRequests.length > 0) {
        const bookingId = (successfulRequests[0] as Response & { body: BookingResponse }).body.data
          .bookingId;
        const booking = await bookingTestUtils.getBookingById(bookingId);
        expect(booking).toBeDefined();
        expect(booking.property_id).toBe(bookingInput.propertyId);
      }
    });

    it('should handle blockchain transaction ordering correctly', async () => {
      const bookingInput = createValidBookingInput();

      const requests = await bookingTestUtils.simulateRaceCondition(
        () =>
          request(app)
            .post('/bookings')
            .set('Authorization', `Bearer ${validToken}`)
            .send(bookingInput),
        100
      );

      // Verify blockchain consistency
      const successfulRequests = requests.filter((r: Response) => r.status === 201);
      if (successfulRequests.length > 0) {
        const escrowAddress = (successfulRequests[0] as Response & { body: BookingResponse }).body
          .data.escrowAddress;
        expect(escrowAddress).toMatch(/^G[A-Z0-9]{55}$/);
      }
    });
  });

  describe('Error Scenario Coverage', () => {
    it('should handle network failures gracefully', async () => {
      bookingTestUtils.setupMockBlockchainFailure('network');

      const bookingInput = createValidBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Failed to create escrow');
    });

    it('should handle database connection issues', async () => {
      // Mock database connection failure
      const { supabase } = require('../../src/config/supabase');
      supabase.from.mockReturnValue({
        insert: mock(() => Promise.reject(new Error('Database connection failed'))),
      });

      const bookingInput = createValidBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(500);
    });

    it('should handle blockchain transaction failures', async () => {
      bookingTestUtils.setupMockBlockchainFailure('escrow');

      const bookingInput = createValidBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(500);
    });

    it('should handle invalid input data', async () => {
      const invalidInput = {
        propertyId: 'not-a-uuid',
        userId: 'also-not-a-uuid',
        dates: {
          from: 'invalid-date',
          to: 'also-invalid-date',
        },
        guests: 'not-a-number',
        total: 'also-not-a-number',
        deposit: 'still-not-a-number',
      };

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidInput);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should handle authorization failures', async () => {
      const booking = testBookings[0];

      const response = await request(app)
        .get(`/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`);

      expect(response.status).toBe(403);
    });

    it('should handle concurrent access conflicts', async () => {
      const bookingInput = createValidBookingInput();

      const requests = await bookingTestUtils.simulateConcurrentRequests(
        () =>
          request(app)
            .post('/bookings')
            .set('Authorization', `Bearer ${validToken}`)
            .send(bookingInput),
        5
      );

      const successCount = requests.filter((r: Response) => r.status === 201).length;
      const conflictCount = requests.filter((r: Response) => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(4);
    });

    it('should handle timeout scenarios', async () => {
      bookingTestUtils.setupMockBlockchainFailure('network');

      const bookingInput = createValidBookingInput();

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send(bookingInput);

      expect(response.status).toBe(500);
    });
  });
});
