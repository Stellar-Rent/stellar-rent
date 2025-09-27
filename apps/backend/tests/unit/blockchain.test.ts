/**
 * Blockchain Contract Unit Tests
 *
 * Tests the blockchain contract functions in isolation with mocking
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  cancelBookingOnChain,
  checkBookingAvailability,
  createBookingOnChain,
  updateBookingStatusOnChain,
} from '../../src/blockchain/bookingContract';
import {
  createPropertyListing,
  generatePropertyHash,
  getPropertyListing,
  propertyToHashData,
  updatePropertyListing,
  verifyPropertyIntegrity,
} from '../../src/blockchain/propertyListingContract';
import type { Property } from '../../src/types/property.types';

// Mock test data
const testProperty: Property = {
  id: 'prop-123',
  title: 'Test Property',
  description: 'A test property',
  price: 100,
  address: '123 Test St',
  city: 'Test City',
  country: 'Test Country',
  latitude: 40.7128,
  longitude: -74.006,
  amenities: ['wifi', 'kitchen'],
  images: ['https://example.com/test.jpg'],
  bedrooms: 2,
  bathrooms: 1,
  max_guests: 4,
  ownerId: 'owner-123',
  status: 'available',
  availability: [],
  security_deposit: 50,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const testPropertyHashData = {
  title: 'Test Property',
  price: 100,
  address: '123 Test St',
  city: 'Test City',
  country: 'Test Country',
  amenities: ['wifi', 'kitchen'],
  bedrooms: 2,
  bathrooms: 1,
  max_guests: 4,
};

describe('Property Listing Contract', () => {
  beforeEach(() => {
    // Set mock mode for tests
    process.env.USE_MOCK = 'true';
  });

  describe('generatePropertyHash', () => {
    it('should generate consistent hash for same data', () => {
      const hash1 = generatePropertyHash(testPropertyHashData);
      const hash2 = generatePropertyHash(testPropertyHashData);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash format
    });

    it('should generate different hashes for different data', () => {
      const modifiedData = { ...testPropertyHashData, price: 200 };
      const hash1 = generatePropertyHash(testPropertyHashData);
      const hash2 = generatePropertyHash(modifiedData);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle amenities order consistently', () => {
      const data1 = { ...testPropertyHashData, amenities: ['wifi', 'kitchen'] };
      const data2 = { ...testPropertyHashData, amenities: ['kitchen', 'wifi'] };

      const hash1 = generatePropertyHash(data1);
      const hash2 = generatePropertyHash(data2);

      // Should be same because amenities are sorted internally
      expect(hash1).toBe(hash2);
    });
  });

  describe('propertyToHashData', () => {
    it('should extract correct hash data from property', () => {
      const hashData = propertyToHashData(testProperty);

      expect(hashData.title).toBe(testProperty.title);
      expect(hashData.price).toBe(testProperty.price);
      expect(hashData.address).toBe(testProperty.address);
      expect(hashData.city).toBe(testProperty.city);
      expect(hashData.country).toBe(testProperty.country);
      expect(hashData.amenities).toEqual(testProperty.amenities);
      expect(hashData.bedrooms).toBe(testProperty.bedrooms);
      expect(hashData.bathrooms).toBe(testProperty.bathrooms);
      expect(hashData.max_guests).toBe(testProperty.max_guests);
    });
  });

  describe('createPropertyListing', () => {
    it('should create property listing in mock mode', async () => {
      const result = await createPropertyListing(
        'test-id',
        testPropertyHashData,
        'test-owner-address'
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('test-id');
      expect(result.data_hash).toBeDefined();
      expect(result.owner).toBe('test-owner-address');
      expect(result.status).toBe('Available');
    });

    it('should generate valid hash in mock mode', async () => {
      const result = await createPropertyListing(
        'test-id',
        testPropertyHashData,
        'test-owner-address'
      );

      const expectedHash = generatePropertyHash(testPropertyHashData);
      expect(result.data_hash).toBe(expectedHash);
    });
  });

  describe('getPropertyListing', () => {
    it('should return property listing in mock mode', async () => {
      const result = await getPropertyListing('test-id');

      expect(result).toBeDefined();
      expect(result?.id).toBe('test-id');
      expect(result?.data_hash).toBe('mock_hash');
      expect(result?.owner).toBe('mock_owner');
      expect(result?.status).toBe('Available');
    });
  });

  describe('updatePropertyListing', () => {
    it('should update property listing in mock mode', async () => {
      const result = await updatePropertyListing(
        'test-id',
        testPropertyHashData,
        'test-owner-address'
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('test-id');
      expect(result.data_hash).toBeDefined();
    });
  });

  describe('verifyPropertyIntegrity', () => {
    it('should verify matching hashes', () => {
      const hash = generatePropertyHash(testPropertyHashData);
      const isValid = verifyPropertyIntegrity(testPropertyHashData, hash);

      expect(isValid).toBe(true);
    });

    it('should reject non-matching hashes', () => {
      const hash = generatePropertyHash(testPropertyHashData);
      const modifiedData = { ...testPropertyHashData, price: 200 };
      const isValid = verifyPropertyIntegrity(modifiedData, hash);

      expect(isValid).toBe(false);
    });
  });
});

describe('Booking Contract', () => {
  beforeEach(() => {
    process.env.USE_MOCK = 'true';
  });

  describe('createBookingOnChain', () => {
    it('should create booking in mock mode', async () => {
      const result = await createBookingOnChain(
        'prop-123',
        'user-123',
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + 86400,
        '100',
        2
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^mock-booking-/);
    });

    it('should generate unique booking IDs', async () => {
      const result1 = await createBookingOnChain(
        'prop-123',
        'user-123',
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + 86400,
        '100',
        2
      );

      const result2 = await createBookingOnChain(
        'prop-123',
        'user-456',
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + 86400,
        '100',
        2
      );

      expect(result1).not.toBe(result2);
    });
  });

  describe('checkBookingAvailability', () => {
    it('should check availability in mock mode', async () => {
      const result = await checkBookingAvailability('prop-123', '2024-06-01', '2024-06-07');

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true); // Mock always returns true
    });
  });

  describe('cancelBookingOnChain', () => {
    it('should cancel booking in mock mode', async () => {
      const result = await cancelBookingOnChain('prop-123', 'booking-123', 'user-123');

      expect(result).toBe(true);
    });
  });

  describe('updateBookingStatusOnChain', () => {
    it('should update booking status in mock mode', async () => {
      const result = await updateBookingStatusOnChain(
        'prop-123',
        'booking-123',
        'confirmed',
        'user-123'
      );

      expect(result).toBe(true);
    });
  });
});

describe('Error Handling', () => {
  it('should handle invalid property data gracefully', () => {
    expect(() => {
      generatePropertyHash({
        title: '',
        price: -1,
        address: '',
        city: '',
        country: '',
        amenities: [],
        bedrooms: 0,
        bathrooms: 0,
        max_guests: 0,
      });
    }).not.toThrow();
  });

  it('should handle blockchain network errors in non-mock mode', async () => {
    process.env.USE_MOCK = 'false';

    // This should not throw but may fail gracefully
    await expect(
      createPropertyListing('test-id', testPropertyHashData, 'invalid-address')
    ).rejects.toThrow();

    process.env.USE_MOCK = 'true';
  });
});
