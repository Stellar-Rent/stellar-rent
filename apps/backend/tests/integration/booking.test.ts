// Import test setup first to configure environment variables
import '../setup';

import { afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import { authenticateToken } from '../../src/middleware/auth.middleware';
import type { Booking } from '../../src/types/booking.types';

// Import controller and service after mocks are set up
import { getBooking } from '../../src/controllers/booking.controller';
import * as bookingServiceModule from '../../src/services/booking.service';

const JWT_SECRET = 'test-secret-key';

function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.get('/bookings/:bookingId', authenticateToken, getBooking);
  return app;
}

describe('GET /bookings/:bookingId', () => {
  let app: express.Express;
  let validToken: string;
  const testBookingId = '123e4567-e89b-12d3-a456-426614174000';

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    validToken = `Bearer ${jwt.sign({ id: 'user-123', email: 'test@example.com' }, JWT_SECRET)}`;
    app = buildTestApp();
  });

  afterEach(() => {
    // Reset mocks after each test
    mock.restore();
  });

  it('400: invalid bookingId (not a UUID)', async () => {
    const res = await request(app).get('/bookings/not-a-uuid').set('Authorization', validToken);

    expect(res.status).toBe(400);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toBe('Bad Request');
  });

  it('401: missing Authorization header', async () => {
    const res = await request(app).get(`/bookings/${testBookingId}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: 'Token no proporcionado',
    });
  });

  it('403: invalid or expired JWT', async () => {
    const res = await request(app)
      .get(`/bookings/${testBookingId}`)
      .set('Authorization', 'Bearer invalid.token');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: 'Token inválido o expirado',
    });
  });

  it('403: user is neither booker nor host', async () => {
    // Mock getBookingById to throw access denied error
    mock.module('../../src/services/booking.service', () => ({
      ...bookingServiceModule,
      getBookingById: mock(async () => {
        throw new Error('Access denied');
      }),
    }));

    const res = await request(app)
      .get(`/bookings/${testBookingId}`)
      .set('Authorization', validToken);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      success: false,
      data: null,
      error: {
        message: 'Access denied',
        details: 'You do not have permission to access this booking.',
      },
    });
  });

  it('404 booking does not exist', async () => {
    // Mock getBookingById to throw booking not found error
    mock.module('../../src/services/booking.service', () => ({
      ...bookingServiceModule,
      getBookingById: mock(async () => {
        throw new Error('Booking not found');
      }),
    }));

    const res = await request(app)
      .get('/bookings/123e4567-e89b-12d3-a456-426614174111')
      .set('Authorization', validToken);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      data: null,
      error: {
        message: 'Booking not found',
        details: 'The booking with the provided ID does not exist.',
      },
    });
  });

  it('404: property or host user missing', async () => {
    // Mock getBookingById to throw property not found error
    mock.module('../../src/services/booking.service', () => ({
      ...bookingServiceModule,
      getBookingById: mock(async () => {
        throw new Error('Property not found');
      }),
    }));

    const res1 = await request(app)
      .get('/bookings/123e4567-e89b-12d3-a456-426614174222')
      .set('Authorization', validToken);

    expect(res1.status).toBe(404);
    expect(res1.body).toEqual({
      success: false,
      data: null,
      error: {
        message: 'Resource not found',
        details: 'Property not found',
      },
    });

    // Mock getBookingById to throw host user not found error
    mock.module('../../src/services/booking.service', () => ({
      ...bookingServiceModule,
      getBookingById: mock(async () => {
        throw new Error('Host user not found');
      }),
    }));

    const res2 = await request(app)
      .get('/bookings/123e4567-e89b-12d3-a456-426614174333')
      .set('Authorization', validToken);

    expect(res2.status).toBe(404);
    expect(res2.body).toEqual({
      success: false,
      data: null,
      error: {
        message: 'Resource not found',
        details: 'Host user not found',
      },
    });
  });

  it('500: unexpected or DB error', async () => {
    // Mock getBookingById to throw database error
    mock.module('../../src/services/booking.service', () => ({
      ...bookingServiceModule,
      getBookingById: mock(async () => {
        throw new Error('Some DB error');
      }),
    }));

    const res = await request(app)
      .get('/bookings/123e4567-e89b-12d3-a456-426614174444')
      .set('Authorization', validToken);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      data: null,
      error: {
        message: 'Internal Server Error',
        details: 'Something went wrong retrieving booking details.',
      },
    });
  });

  it('200: successful retrieval', async () => {
    const bookingId = '123e4567-e89b-12d3-a456-426614174555';
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const propertyId = '123e4567-e89b-12d3-a456-426614174001';
    
    // Mock getBookingById to return data that matches BookingResponseSchema
    const mockGetBookingById = mock(async () => {
      return {
        id: bookingId,
        userId: userId,
        propertyId: propertyId,
        dates: {
          from: '2025-06-01T00:00:00.000Z',
          to: '2025-06-05T00:00:00.000Z',
        },
        guests: 2,
        total: 1000,
        deposit: 200,
        status: 'pending',
        escrowAddress: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
    
    mock.module('../../src/services/booking.service', () => ({
      ...bookingServiceModule,
      getBookingById: mockGetBookingById,
    }));

    // Re-import controller to get the mocked service
    const { getBooking: getBookingMocked } = await import('../../src/controllers/booking.controller');
    const testApp = express();
    testApp.use(express.json());
    testApp.get('/bookings/:bookingId', authenticateToken, getBookingMocked);

    const res = await request(testApp)
      .get(`/bookings/${bookingId}`)
      .set('Authorization', validToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(bookingId);
  });
});
