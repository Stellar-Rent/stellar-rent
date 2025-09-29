/**
 * Blockchain Integration Tests
 *
 * Tests the complete blockchain integration for StellarRent including:
 * - Property creation and blockchain sync
 * - Booking creation and blockchain sync
 * - Property verification with blockchain
 * - Sync service functionality
 * - Error handling and rollback scenarios
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import express from 'express';
import request from 'supertest';
import {
  checkBookingAvailability,
  createBookingOnChain,
} from '../../src/blockchain/bookingContract';
import {
  createPropertyListing,
  getPropertyListing,
  verifyPropertyIntegrity,
} from '../../src/blockchain/propertyListingContract';
import { supabase } from '../../src/config/supabase';
import { syncService } from '../../src/services/sync.service';

// Test app setup
const app = express();
app.use(express.json());

import bookingRoutes from '../../src/routes/booking.route';
// Import routes
import propertyRoutes from '../../src/routes/property.route';
import syncRoutes from '../../src/routes/sync.routes';

app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/sync', syncRoutes);

// Mock data
const testProperty = {
  title: 'Blockchain Test Property',
  description: 'A test property for blockchain integration',
  price: 100,
  address: '123 Test St',
  city: 'Test City',
  country: 'Test Country',
  latitude: 40.7128,
  longitude: -74.006,
  amenities: ['wifi', 'kitchen'],
  images: ['https://example.com/image1.jpg'],
  bedrooms: 2,
  bathrooms: 1,
  max_guests: 4,
  availability: [
    {
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      is_available: true,
    },
  ],
  ownerId: '123e4567-e89b-12d3-a456-426614174000',
};

const testBooking = {
  propertyId: '',
  userId: '123e4567-e89b-12d3-a456-426614174001',
  dates: {
    from: new Date('2024-06-01'),
    to: new Date('2024-06-07'),
  },
  guests: 2,
  total: 600,
  deposit: 100,
};

describe('Blockchain Integration Tests', () => {
  let propertyId: string;
  let bookingId: string;

  beforeAll(async () => {
    // Set up test environment variables
    process.env.USE_MOCK = 'true';
    process.env.SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
    process.env.SOROBAN_CONTRACT_ID = 'TEST_CONTRACT_ID';
    process.env.SOROBAN_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
  });

  beforeEach(async () => {
    // Reset mocks
    mock.restore();

    // Clean up test data
    await supabase.from('properties').delete().like('title', '%Blockchain Test%');

    await supabase.from('bookings').delete().eq('user_id', testBooking.userId);

    await supabase.from('sync_events').delete().like('event_id', '%test%');
  });

  afterEach(async () => {
    // Clean up after each test
    if (propertyId) {
      await supabase.from('properties').delete().eq('id', propertyId);
    }

    if (bookingId) {
      await supabase.from('bookings').delete().eq('id', bookingId);
    }
  });

  describe('Property Blockchain Integration', () => {
    it('should create property and sync with blockchain', async () => {
      const response = await request(app).post('/api/properties').send(testProperty).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      propertyId = response.body.data.id;

      // Verify property was created in database
      const { data: dbProperty } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      expect(dbProperty).toBeDefined();
      expect(dbProperty.title).toBe(testProperty.title);

      // Verify blockchain hash was set
      expect(dbProperty.property_token).toBeDefined();
      expect(dbProperty.property_token).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
    });

    it('should verify property integrity with blockchain', async () => {
      // First create a property
      const createResponse = await request(app)
        .post('/api/properties')
        .send(testProperty)
        .expect(201);

      propertyId = createResponse.body.data.id;

      // Then verify it
      const verifyResponse = await request(app)
        .get(`/api/properties/${propertyId}/verify`)
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.data.isValid).toBe(true);
      expect(verifyResponse.body.data.blockchainData).toBeDefined();
    });

    it('should handle blockchain sync failure gracefully', async () => {
      // Mock blockchain failure
      process.env.USE_MOCK = 'false'; // Force real blockchain call which will fail in test

      const response = await request(app).post('/api/properties').send(testProperty).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.warning).toContain('blockchain');

      propertyId = response.body.data.id;

      // Reset mock setting
      process.env.USE_MOCK = 'true';
    });

    it('should update property and sync status with blockchain', async () => {
      // Create property first
      const createResponse = await request(app)
        .post('/api/properties')
        .send(testProperty)
        .expect(201);

      propertyId = createResponse.body.data.id;

      // Update property status
      const updateResponse = await request(app)
        .put(`/api/properties/${propertyId}`)
        .send({ status: 'maintenance' })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.status).toBe('maintenance');
    });
  });

  describe('Booking Blockchain Integration', () => {
    beforeEach(async () => {
      // Create a test property first
      const response = await request(app).post('/api/properties').send(testProperty).expect(201);

      propertyId = response.body.data.id;
      testBooking.propertyId = propertyId;
    });

    it('should create booking and sync with blockchain', async () => {
      const response = await request(app).post('/api/bookings').send(testBooking).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      bookingId = response.body.data.bookingId;

      // Verify booking was created in database
      const { data: dbBooking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      expect(dbBooking).toBeDefined();
      expect(dbBooking.blockchain_booking_id).toBeDefined();
      expect(dbBooking.escrow_address).toBeDefined();
    });

    it('should check booking availability through blockchain', async () => {
      // First create a booking
      const createResponse = await request(app).post('/api/bookings').send(testBooking).expect(201);

      bookingId = createResponse.body.data.bookingId;

      // Check availability for overlapping dates
      const availability = await checkBookingAvailability(propertyId, '2024-06-03', '2024-06-05');

      expect(availability).toBe(false); // Should be unavailable due to existing booking
    });

    it('should cancel booking and sync with blockchain', async () => {
      // Create booking first
      const createResponse = await request(app).post('/api/bookings').send(testBooking).expect(201);

      bookingId = createResponse.body.data.bookingId;

      // Cancel booking
      const cancelResponse = await request(app)
        .post(`/api/bookings/${bookingId}/cancel`)
        .send({ userId: testBooking.userId })
        .expect(200);

      expect(cancelResponse.body.success).toBe(true);

      // Verify status in database
      const { data: dbBooking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      expect(dbBooking.status).toBe('cancelled');
    });
  });

  describe('Sync Service Integration', () => {
    it('should start and stop sync service', async () => {
      const initialStatus = syncService.getStatus();
      expect(initialStatus.isRunning).toBe(false);

      await syncService.start();
      const runningStatus = syncService.getStatus();
      expect(runningStatus.isRunning).toBe(true);

      await syncService.stop();
      const stoppedStatus = syncService.getStatus();
      expect(stoppedStatus.isRunning).toBe(false);
    });

    it('should process blockchain events', async () => {
      // Create a test sync event
      await supabase.from('sync_events').insert({
        event_id: 'test-event-1',
        event_type: 'booking_created',
        booking_id: 'test-booking-id',
        property_id: 'test-property-id',
        user_id: 'test-user-id',
        event_data: {
          escrow_id: 'test-escrow',
          property_id: 'test-property-id',
          user_id: 'test-user-id',
          start_date: Math.floor(Date.now() / 1000),
          end_date: Math.floor(Date.now() / 1000) + 86400,
          total_price: 100,
          status: 'pending',
        },
        processed: false,
      });

      // Trigger manual sync
      await syncService.triggerManualSync();

      // Verify event was processed
      const { data: processedEvent } = await supabase
        .from('sync_events')
        .select('*')
        .eq('event_id', 'test-event-1')
        .single();

      expect(processedEvent.processed).toBe(true);
    });

    it('should get sync statistics', async () => {
      const stats = await syncService.getSyncStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalEvents).toBe('number');
      expect(typeof stats.failedEvents).toBe('number');
      expect(stats.status).toBeDefined();
    });

    it('should handle polling errors gracefully', async () => {
      // This should not crash the service even with network errors
      await syncService.triggerManualSync();

      const status = syncService.getStatus();
      // Just verify the service can handle errors without crashing
      expect(status).toBeDefined();
    });
  });

  describe('End-to-End Blockchain Flow', () => {
    it('should complete full property and booking lifecycle with blockchain sync', async () => {
      // 1. Create property with blockchain sync
      const propertyResponse = await request(app)
        .post('/api/properties')
        .send(testProperty)
        .expect(201);

      propertyId = propertyResponse.body.data.id;
      testBooking.propertyId = propertyId;

      // 2. Verify property on blockchain
      const verifyResponse = await request(app)
        .get(`/api/properties/${propertyId}/verify`)
        .expect(200);

      expect(verifyResponse.body.data.isValid).toBe(true);

      // 3. Create booking with blockchain sync
      const bookingResponse = await request(app)
        .post('/api/bookings')
        .send(testBooking)
        .expect(201);

      bookingId = bookingResponse.body.data.bookingId;

      // 4. Update booking status
      const statusUpdateResponse = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .send({
          status: 'confirmed',
          requestorId: testBooking.userId,
        })
        .expect(200);

      expect(statusUpdateResponse.body.success).toBe(true);

      // 5. Verify final state
      const { data: finalBooking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      expect(finalBooking.status).toBe('confirmed');
      expect(finalBooking.blockchain_booking_id).toBeDefined();
      expect(finalBooking.escrow_address).toBeDefined();
    });
  });

  describe('Error Handling and Rollback', () => {
    it('should rollback booking creation if blockchain fails', async () => {
      // Create property first
      const propertyResponse = await request(app)
        .post('/api/properties')
        .send(testProperty)
        .expect(201);

      propertyId = propertyResponse.body.data.id;
      testBooking.propertyId = propertyId;

      // Mock blockchain failure after escrow creation
      process.env.USE_MOCK = 'false';

      const response = await request(app).post('/api/bookings').send(testBooking).expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('blockchain');

      // Verify no booking was created in database
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', testBooking.userId);

      expect(bookings).toHaveLength(0);

      // Reset
      process.env.USE_MOCK = 'true';
    });

    it('should handle network timeouts gracefully', async () => {
      // This should handle network issues gracefully
      await syncService.triggerManualSync();

      const status = syncService.getStatus();
      // Just verify the service handles issues without crashing
      expect(status).toBeDefined();
    });
  });
});
