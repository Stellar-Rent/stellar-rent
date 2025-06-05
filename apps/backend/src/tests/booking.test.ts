import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import { getBooking } from '../controllers/booking.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import * as bookingService from '../services/booking.service';

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
    jest.restoreAllMocks();
  });

  it('400: invalid bookingId (not a UUID)', async () => {
    const res = await request(app).get('/bookings/not-a-uuid').set('Authorization', validToken);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      data: null,
      error: {
        message: 'Bad Request',
        details: expect.any(Object),
      },
    });
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
    jest.spyOn(bookingService, 'getBookingById').mockImplementation(async () => {
      throw new Error('Access denied');
    });

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
    jest.spyOn(bookingService, 'getBookingById').mockImplementation(async () => {
      throw new Error('Booking not found');
    });

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
    jest.spyOn(bookingService, 'getBookingById').mockImplementation(async () => {
      throw new Error('Property not found');
    });

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

    jest.spyOn(bookingService, 'getBookingById').mockImplementation(async () => {
      throw new Error('Host user not found');
    });

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
    jest.spyOn(bookingService, 'getBookingById').mockImplementation(async () => {
      throw new Error('Some DB error');
    });

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
    const fakeBooking = {
      id: '123e4567-e89b-12d3-a456-426614174555',
      property: 'Seaside Villa',
      dates: { from: '2025-06-01', to: '2025-06-05' },
      hostContact: 'host@example.com',
      escrowStatus: 'pending',
    };

    jest.spyOn(bookingService, 'getBookingById').mockResolvedValue(fakeBooking);

    const res = await request(app)
      .get(`/bookings/${fakeBooking.id}`)
      .set('Authorization', validToken);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: fakeBooking,
    });
  });
});
