import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { Server } from 'bun';
import express from 'express';
import { LocationService } from '../../src/services/location.service';

describe('Location API', () => {
  let server: Server;
  let locationService: LocationService;

  beforeAll(() => {
    server = app.listen(3000);
    locationService = new LocationService();
  });

  afterAll(() => {
    server.stop();
  });

  describe('GET /api/locations/autocomplete', () => {
    it('should return location suggestions for valid query', async () => {
      const response = await fetch('http://localhost:3000/api/locations/autocomplete?query=London');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.suggestions)).toBe(true);
      expect(data.data.query).toBe('London');
    });

    it('should handle empty query parameter', async () => {
      const response = await fetch('http://localhost:3000/api/locations/autocomplete?query=');
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation error');
    });

    it('should handle special characters in query', async () => {
      const response = await fetch(
        'http://localhost:3000/api/locations/autocomplete?query=São Paulo'
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const response = await fetch(
        'http://localhost:3000/api/locations/autocomplete?query=a&limit=5'
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should handle invalid limit parameter', async () => {
      const response = await fetch(
        'http://localhost:3000/api/locations/autocomplete?query=a&limit=1000'
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/locations/popular', () => {
    it('should return popular locations', async () => {
      const response = await fetch('http://localhost:3000/api/locations/popular');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.suggestions)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const response = await fetch('http://localhost:3000/api/locations/popular?limit=5');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/locations/health', () => {
    it('should return healthy status', async () => {
      const response = await fetch('http://localhost:3000/api/locations/health');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
    });
  });

  describe('LocationService', () => {
    it('should handle large datasets efficiently', async () => {
      const start = performance.now();
      const result = await locationService.getLocationSuggestions('a', 50);
      const end = performance.now();

      expect(result.success).toBe(true);
      a;
      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should properly deduplicate results', async () => {
      const result = await locationService.getLocationSuggestions('new', 20);

      if (result.success && result.data) {
        const cities = result.data.suggestions.map((s) => `${s.city}-${s.country}`);
        const uniqueCities = new Set(cities);
        expect(cities.length).toBe(uniqueCities.size);
      }
    });
  });
});
