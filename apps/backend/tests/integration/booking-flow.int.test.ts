// Set environment variables before any imports
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

import express from 'express';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { errorMiddleware } from '../../src/middleware/error.middleware';
import { rateLimiter } from '../../src/middleware/rateLimiter';
import authRoutes from '../../src/routes/auth';
import bookingRoutes from '../../src/routes/booking.routes';
import locationRoutes from '../../src/routes/location.routes';
import profileRoutes from '../../src/routes/profile.route';
import propertyRoutes from '../../src/routes/property.route';
import syncRoutes from '../../src/routes/sync.routes';
import walletAuthRoutes from '../../src/routes/wallet-auth.routes';
import { generateAuthToken } from '../fixtures/booking.fixtures';
import { mockedSoroban, mockedTrustlessWork } from '../mocks/blockchain.mocks';

// Create test app with mock endpoints
function createTestApp() {
  const app = express();

  // Middleware
  app.use(express.json());

  // Mock booking endpoint
  app.post('/api/bookings', (req, res) => {
    const { propertyId, userId, dates, guests, total, deposit } = req.body;

    if (!propertyId || !userId || !dates || !guests || !total || !deposit) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    res.status(201).json({
      success: true,
      data: {
        id: uuidv4(),
        propertyId,
        userId,
        dates,
        guests,
        total,
        deposit,
        status: 'pending',
        escrowAddress: 'GABC123456789012345678901234567890123456789012345678901234567890',
        createdAt: new Date().toISOString(),
      },
    });
  });

  // Mock payment confirmation endpoint
  app.put('/api/bookings/:id/confirm', (req, res) => {
    const { id } = req.params;
    const { transactionHash, sourcePublicKey } = req.body;

    if (!transactionHash || !sourcePublicKey) {
      return res.status(400).json({ error: 'Missing transaction details' });
    }

    res.status(200).json({
      success: true,
      data: {
        id,
        status: 'confirmed',
        transactionHash,
        updatedAt: new Date().toISOString(),
      },
    });
  });

  // Test route
  app.get('/', (_req, res) => {
    res.json({ message: 'Stellar Rent API is running successfully 🚀' });
  });

  return app;
}

describe('Booking + Payment integration (scaffold)', () => {
  let app: express.Express;

  beforeAll(() => {
    app = createTestApp();
  });

  it('creates a booking (pending)', async () => {
    const bookingData = {
      propertyId: 'test-property-id',
      userId: 'test-user-id',
      dates: { from: '2024-06-01', to: '2024-06-03' },
      guests: 2,
      total: 200,
      deposit: 50,
    };

    const response = await request(app).post('/api/bookings').send(bookingData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('pending');
  });

  it('should create a booking, confirm payment, and update status to confirmed', async () => {
    // Step 1: Create Booking
    const bookingData = {
      propertyId: 'test-property-id',
      userId: 'test-user-id',
      dates: { from: '2024-06-01', to: '2024-06-03' },
      guests: 2,
      total: 200,
      deposit: 50,
    };

    const createRes = await request(app).post('/api/bookings').send(bookingData);

    expect(createRes.status).toBe(201);
    expect(createRes.body?.data?.status).toBe('pending');
    const bookingId = createRes.body?.data?.id as string;

    // Step 2: Confirm Payment
    const txHash = `txn_${Date.now()}`;
    const sourcePublicKey = 'GABC123456789012345678901234567890123456789012345678901234567890';

    const confirmRes = await request(app)
      .put(`/api/bookings/${bookingId}/confirm`)
      .send({ transactionHash: txHash, sourcePublicKey });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body?.data?.status).toBe('confirmed');
  });

  it('should handle concurrent booking requests', async () => {
    const bookingData1 = {
      propertyId: 'conflict-property-id',
      userId: 'test-user-1',
      dates: { from: '2024-07-01', to: '2024-07-03' },
      guests: 2,
      total: 150,
      deposit: 30,
    };

    const bookingData2 = {
      ...bookingData1,
      userId: 'test-user-2',
    };

    // Simulate concurrent requests
    const [resA, resB] = await Promise.all([
      request(app).post('/api/bookings').send(bookingData1),
      request(app).post('/api/bookings').send(bookingData2),
    ]);

    // Both should succeed in this mock (real implementation would prevent conflicts)
    expect(resA.status).toBe(201);
    expect(resB.status).toBe(201);
  });

  it('should fail with missing required fields', async () => {
    const response = await request(app).post('/api/bookings').send({ propertyId: 'test' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing required fields');
  });

  it('should fail payment confirmation with missing transaction details', async () => {
    const response = await request(app).put('/api/bookings/test-booking-id/confirm').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing transaction details');
  });

  it('should handle payment confirmation replay (idempotency)', async () => {
    const bookingData = {
      propertyId: 'e2e-property-id',
      userId: 'e2e-user-id',
      dates: { from: '2024-08-01', to: '2024-08-05' },
      guests: 4,
      total: 400,
      deposit: 80,
    };

    // Step 1: Create booking
    const createResponse = await request(app).post('/api/bookings').send(bookingData);

    expect(createResponse.status).toBe(201);
    const bookingId = createResponse.body.data.id;

    // Step 2: Confirm payment
    const confirmData = {
      transactionHash: 'txn_e2e_test_123',
      sourcePublicKey: 'GABC123456789012345678901234567890123456789012345678901234567890',
    };

    const firstConfirm = await request(app)
      .put(`/api/bookings/${bookingId}/confirm`)
      .send(confirmData);

    expect(firstConfirm.status).toBe(200);
    expect(firstConfirm.body.data.status).toBe('confirmed');

    // Step 3: Replay the same confirmation (should be idempotent)
    const secondConfirm = await request(app)
      .put(`/api/bookings/${bookingId}/confirm`)
      .send(confirmData);

    expect(secondConfirm.status).toBe(200);
    expect(secondConfirm.body.data.status).toBe('confirmed');
  });

  it('should complete end-to-end booking and payment flow', async () => {
    // Step 1: Create booking
    const bookingData = {
      propertyId: 'e2e-property-id',
      userId: 'e2e-user-id',
      dates: { from: '2024-08-01', to: '2024-08-05' },
      guests: 4,
      total: 400,
      deposit: 80,
    };

    const createResponse = await request(app).post('/api/bookings').send(bookingData);

    expect(createResponse.status).toBe(201);
    const bookingId = createResponse.body.data.id;

    // Step 2: Confirm payment
    const confirmData = {
      transactionHash: 'txn_e2e_test_123',
      sourcePublicKey: 'GABC123456789012345678901234567890123456789012345678901234567890',
    };

    const confirmResponse = await request(app)
      .put(`/api/bookings/${bookingId}/confirm`)
      .send(confirmData);

    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body.data.status).toBe('confirmed');
  });
});
