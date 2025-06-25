import express from 'express';
import request from 'supertest';
import locationRoutes from '../src/routes/location.routes';
import { LocationService } from '../src/services/location.service';

// Mock Supabase with proper typing
interface MockChain {
  select: jest.Mock;
  or: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
}

interface MockSupabase {
  from: jest.Mock<MockChain>;
}

const mockSupabase: MockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      or: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() =>
              Promise.resolve({
                data: [],
                error: null,
              })
            ),
          })),
        })),
      })),
    })),
    or: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
  })),
};

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/locations', locationRoutes);
  return app;
};

describe('Location API Endpoints', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/locations/autocomplete', () => {
    it('should return 400 for missing query parameter', async () => {
      const response = await request(app).get('/api/locations/autocomplete').expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'query',
            message: expect.stringContaining('Query must be at least 1 character'),
          }),
        ]),
      });
    });

    it('should return 400 for empty query parameter', async () => {
      const response = await request(app).get('/api/locations/autocomplete?query=').expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation error',
      });
    });

    it('should return 400 for query with invalid characters', async () => {
      const response = await request(app)
        .get('/api/locations/autocomplete?query=test@#$%')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('invalid characters'),
          }),
        ]),
      });
    });

    it('should return 400 for limit outside valid range', async () => {
      const response = await request(app)
        .get('/api/locations/autocomplete?query=test&limit=100')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('Limit must be between 1 and 50'),
          }),
        ]),
      });
    });

    it('should return empty results for query with no matches', async () => {
      // Mock empty database response
      const mockChain: MockChain = {
        select: jest.fn(() => ({
          or: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() =>
                  Promise.resolve({
                    data: [],
                    error: null,
                  })
                ),
              })),
            })),
          })),
        })),
        or: jest.fn(),
        eq: jest.fn(),
        order: jest.fn(),
        limit: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockChain);

      const response = await request(app)
        .get('/api/locations/autocomplete?query=nonexistent')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          suggestions: [],
          total: 0,
          query: 'nonexistent',
        },
      });
    });

    it('should return location suggestions for valid query', async () => {
      // Mock database response with sample data
      const mockData = [
        { city: 'Buenos Aires', country: 'Argentina' },
        { city: 'Barcelona', country: 'Spain' },
        { city: 'Berlin', country: 'Germany' },
      ];

      const mockChain: MockChain = {
        select: jest.fn(() => ({
          or: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() =>
                  Promise.resolve({
                    data: mockData,
                    error: null,
                  })
                ),
              })),
            })),
          })),
        })),
        or: jest.fn(),
        eq: jest.fn(),
        order: jest.fn(),
        limit: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockChain);

      const response = await request(app).get('/api/locations/autocomplete?query=B').expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          suggestions: expect.arrayContaining([
            expect.objectContaining({
              city: expect.any(String),
              country: expect.any(String),
              match_type: expect.stringMatching(/^(city|country|both)$/),
            }),
          ]),
          total: expect.any(Number),
          query: 'B',
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const mockChain: MockChain = {
        select: jest.fn(() => ({
          or: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: { message: 'Database connection failed' },
                  })
                ),
              })),
            })),
          })),
        })),
        or: jest.fn(),
        eq: jest.fn(),
        order: jest.fn(),
        limit: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockChain);

      const response = await request(app).get('/api/locations/autocomplete?query=test').expect(503);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Failed to fetch'),
      });
    });

    it('should respect limit parameter', async () => {
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        city: `City${i}`,
        country: `Country${i}`,
      }));

      const mockChain: MockChain = {
        select: jest.fn(() => ({
          or: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() =>
                  Promise.resolve({
                    data: mockData,
                    error: null,
                  })
                ),
              })),
            })),
          })),
        })),
        or: jest.fn(),
        eq: jest.fn(),
        order: jest.fn(),
        limit: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockChain);

      const response = await request(app)
        .get('/api/locations/autocomplete?query=City&limit=5')
        .expect(200);

      expect(response.body.data.suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/locations/popular', () => {
    it('should return popular locations', async () => {
      const mockData = [
        { city: 'Buenos Aires', country: 'Argentina' },
        { city: 'Barcelona', country: 'Spain' },
      ];

      const mockChain: Partial<MockChain> = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() =>
              Promise.resolve({
                data: mockData,
                error: null,
              })
            ),
          })),
        })),
      };

      mockSupabase.from.mockReturnValue(mockChain as MockChain);

      const response = await request(app).get('/api/locations/popular').expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          suggestions: expect.any(Array),
          total: expect.any(Number),
          query: '',
        },
      });
    });

    it('should respect limit parameter for popular locations', async () => {
      const response = await request(app).get('/api/locations/popular?limit=3').expect(200);

      expect(response.body.data.suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('GET /api/locations/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/locations/health').expect(200);

      expect(response.body).toMatchObject({
        status: expect.stringMatching(/^(healthy|unhealthy)$/),
        service: 'location-service',
        timestamp: expect.any(String),
      });
    });
  });
});

describe('LocationService', () => {
  let locationService: LocationService;

  beforeEach(() => {
    // Create a properly typed mock object
    locationService = new LocationService(mockSupabase as MockSupabase);
    jest.clearAllMocks();
  });

  describe('getLocationSuggestions', () => {
    it('should sanitize query input', async () => {
      const mockChain: MockChain = {
        select: jest.fn(() => ({
          or: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() =>
                  Promise.resolve({
                    data: [],
                    error: null,
                  })
                ),
              })),
            })),
          })),
        })),
        or: jest.fn(),
        eq: jest.fn(),
        order: jest.fn(),
        limit: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockChain);

      await locationService.getLocationSuggestions('  Test Query  ');

      // Verify that the query was sanitized (trimmed and lowercased)
      expect(mockChain.or).toHaveBeenCalledWith(expect.stringContaining('test query'));
    });

    it('should deduplicate location results', async () => {
      const mockData = [
        { city: 'Buenos Aires', country: 'Argentina' },
        { city: 'Buenos Aires', country: 'Argentina' }, // Duplicate
        { city: 'Barcelona', country: 'Spain' },
      ];

      const mockChain: MockChain = {
        select: jest.fn(() => ({
          or: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() =>
                  Promise.resolve({
                    data: mockData,
                    error: null,
                  })
                ),
              })),
            })),
          })),
        })),
        or: jest.fn(),
        eq: jest.fn(),
        order: jest.fn(),
        limit: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockChain);

      const result = await locationService.getLocationSuggestions('B');

      expect(result.success).toBe(true);
      expect(result.data?.suggestions.length).toBe(2); // Should be deduplicated
    });

    it('should handle special characters in query', async () => {
      const result = await locationService.getLocationSuggestions('São Paulo');

      expect(result.success).toBe(true);
      // Should not throw error and should handle accented characters
    });
  });
});
