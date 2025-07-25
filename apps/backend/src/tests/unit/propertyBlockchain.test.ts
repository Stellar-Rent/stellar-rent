import { describe, expect, test, beforeEach } from 'bun:test';
import {
  generatePropertyHash,
  verifyPropertyIntegrity,
  propertyToHashData,
  type PropertyHashData,
} from '../../blockchain/propertyListingContract';
import type { Property } from '../../types/property.types';

describe('Property Blockchain Integration', () => {
  let mockProperty: Property;
  let mockPropertyHashData: PropertyHashData;

  beforeEach(() => {
    mockProperty = {
      id: 'test-property-id',
      title: 'Beautiful Apartment',
      description: 'A lovely apartment in the city center',
      price: 100,
      location: {
        address: '123 Main St',
        city: 'New York',
        country: 'USA',
        coordinates: { latitude: 40.7128, longitude: -74.0060 },
      },
      amenities: ['wifi', 'kitchen', 'parking'],
      images: ['image1.jpg', 'image2.jpg'],
      bedrooms: 2,
      bathrooms: 1,
      maxGuests: 4,
      ownerId: 'owner-123',
      propertyToken: null,
      status: 'available',
      availability: [{ from: '2024-01-01', to: '2024-12-31' }],
      securityDeposit: 200,
      cancellationPolicy: { daysBefore: 7, refundPercentage: 80 },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    mockPropertyHashData = {
      title: 'Beautiful Apartment',
      price: 100,
      address: '123 Main St',
      city: 'New York',
      country: 'USA',
      amenities: ['wifi', 'kitchen', 'parking'],
      bedrooms: 2,
      bathrooms: 1,
      max_guests: 4,
    };
  });

  describe('generatePropertyHash', () => {
    test('should generate consistent hash for same data', () => {
      const hash1 = generatePropertyHash(mockPropertyHashData);
      const hash2 = generatePropertyHash(mockPropertyHashData);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64-character hex string
    });

    test('should generate different hash for different data', () => {
      const hash1 = generatePropertyHash(mockPropertyHashData);
      
      const modifiedData = { ...mockPropertyHashData, price: 150 };
      const hash2 = generatePropertyHash(modifiedData);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should sort amenities for consistency', () => {
      const data1 = { ...mockPropertyHashData, amenities: ['wifi', 'kitchen', 'parking'] };
      const data2 = { ...mockPropertyHashData, amenities: ['parking', 'wifi', 'kitchen'] };
      
      const hash1 = generatePropertyHash(data1);
      const hash2 = generatePropertyHash(data2);
      
      expect(hash1).toBe(hash2);
    });

    test('should trim whitespace from strings', () => {
      const data1 = { ...mockPropertyHashData, title: 'Beautiful Apartment' };
      const data2 = { ...mockPropertyHashData, title: '  Beautiful Apartment  ' };
      
      const hash1 = generatePropertyHash(data1);
      const hash2 = generatePropertyHash(data2);
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('verifyPropertyIntegrity', () => {
    test('should return true for matching hash', () => {
      const hash = generatePropertyHash(mockPropertyHashData);
      const isValid = verifyPropertyIntegrity(mockPropertyHashData, hash);
      
      expect(isValid).toBe(true);
    });

    test('should return false for non-matching hash', () => {
      const hash = generatePropertyHash(mockPropertyHashData);
      const modifiedData = { ...mockPropertyHashData, price: 150 };
      const isValid = verifyPropertyIntegrity(modifiedData, hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('propertyToHashData', () => {
    test('should convert Property to PropertyHashData correctly', () => {
      const hashData = propertyToHashData(mockProperty);
      
      expect(hashData).toEqual({
        title: mockProperty.title,
        price: mockProperty.price,
        address: mockProperty.location.address,
        city: mockProperty.location.city,
        country: mockProperty.location.country,
        amenities: mockProperty.amenities,
        bedrooms: mockProperty.bedrooms,
        bathrooms: mockProperty.bathrooms,
        max_guests: mockProperty.maxGuests,
      });
    });

    test('should generate valid hash from converted data', () => {
      const hashData = propertyToHashData(mockProperty);
      const hash = generatePropertyHash(hashData);
      
      expect(hash).toHaveLength(64);
      expect(typeof hash).toBe('string');
    });
  });

  describe('Integration scenarios', () => {
    test('should maintain integrity through conversion and hashing', () => {
      // Convert property to hash data
      const hashData = propertyToHashData(mockProperty);
      
      // Generate hash
      const hash = generatePropertyHash(hashData);
      
      // Verify integrity
      const isValid = verifyPropertyIntegrity(hashData, hash);
      
      expect(isValid).toBe(true);
    });

    test('should detect tampering after conversion', () => {
      // Convert property to hash data
      const hashData = propertyToHashData(mockProperty);
      
      // Generate hash
      const originalHash = generatePropertyHash(hashData);
      
      // Tamper with data
      hashData.price = 999;
      
      // Verify integrity (should fail)
      const isValid = verifyPropertyIntegrity(hashData, originalHash);
      
      expect(isValid).toBe(false);
    });
  });
});
