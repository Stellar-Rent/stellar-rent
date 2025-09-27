import express from 'express';
import request from 'supertest';
import { getPropertyByIdController } from '../controllers/property.controller';
import * as propertyService from '../services/property.service';
import { validatePropertyId } from '../validators/property.validator';

function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.get('/properties/:id', validatePropertyId, getPropertyByIdController);
  return app;
}

describe('GET /properties/:id', () => {
  let app: express.Express;
  const testPropertyId = '123e4567-e89b-12d3-a456-426614174000';

  beforeAll(() => {
    app = buildTestApp();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('400: invalid property ID (not a UUID)', async () => {
    const res = await request(app).get('/properties/not-a-uuid');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'Validation error',
      details: expect.arrayContaining([
        expect.objectContaining({
          path: 'id',
          message: 'Invalid property ID format',
        }),
      ]),
    });
  });

  it('404: property does not exist', async () => {
    jest.spyOn(propertyService, 'getPropertyById').mockResolvedValue({
      success: false,
      error: 'Property not found',
    });

    const res = await request(app).get(`/properties/${testPropertyId}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: 'Property not found',
    });
  });

  it('500: database error', async () => {
    jest.spyOn(propertyService, 'getPropertyById').mockResolvedValue({
      success: false,
      error: 'Internal server error',
      details: new Error('Database connection failed'),
    });

    const res = await request(app).get(`/properties/${testPropertyId}`);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: 'Internal server error',
      details: expect.any(Object),
    });
  });

  it('200: successful property retrieval', async () => {
    const mockProperty = {
      id: testPropertyId,
      title: 'Luxury Villa',
      description: 'Beautiful villa with ocean view',
      price: 250,
      location: {
        address: '123 Beach Road',
        city: 'Miami',
        country: 'USA',
        coordinates: { latitude: 25.7617, longitude: -80.1918 },
      },
      amenities: ['wifi', 'pool', 'parking'],
      images: ['https://example.com/image1.jpg'],
      bedrooms: 3,
      bathrooms: 2,
      maxGuests: 6,
      ownerId: 'owner-123',
      status: 'available' as const,
      availability: [{ from: '2024-01-01', to: '2024-12-31' }],
      securityDeposit: 500,
      cancellationPolicy: {
        daysBefore: 7,
        refundPercentage: 80,
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    jest.spyOn(propertyService, 'getPropertyById').mockResolvedValue({
      success: true,
      data: mockProperty,
    });

    const res = await request(app).get(`/properties/${testPropertyId}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: mockProperty,
    });

    // Verify property structure
    const property = res.body.data;
    expect(property).toHaveProperty('id');
    expect(property).toHaveProperty('title');
    expect(property).toHaveProperty('description');
    expect(property).toHaveProperty('price');
    expect(property).toHaveProperty('location');
    expect(property.location).toHaveProperty('address');
    expect(property.location).toHaveProperty('city');
    expect(property.location).toHaveProperty('country');
    expect(property.location).toHaveProperty('coordinates');
    expect(property).toHaveProperty('amenities');
    expect(Array.isArray(property.amenities)).toBe(true);
    expect(property).toHaveProperty('images');
    expect(Array.isArray(property.images)).toBe(true);
    expect(property).toHaveProperty('bedrooms');
    expect(property).toHaveProperty('bathrooms');
    expect(property).toHaveProperty('maxGuests');
    expect(property).toHaveProperty('ownerId');
    expect(property).toHaveProperty('status');
    expect(property.status).toBe('available');
    expect(property).toHaveProperty('availability');
    expect(Array.isArray(property.availability)).toBe(true);
    expect(property).toHaveProperty('securityDeposit');
    expect(property).toHaveProperty('cancellationPolicy');
    expect(property).toHaveProperty('createdAt');
    expect(property).toHaveProperty('updatedAt');
  });
});
