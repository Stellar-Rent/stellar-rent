import crypto from 'node:crypto';
import { type RedisClientType, createClient } from 'redis';
import { loggingService } from './logging.service';

export class CacheService {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis Client Disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
        this.isConnected = true;
      } catch (error) {
        console.error('Failed to connect to Redis:', error);
        this.isConnected = false;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  /**
   * Generate cache key for search queries
   * @param prefix - Cache key prefix
   * @param filters - Search filters object
   * @returns Generated cache key
   */
  private generateCacheKey(prefix: string, filters: Record<string, unknown>): string {
    const filterString = JSON.stringify(filters, Object.keys(filters).sort());
    const hash = crypto.createHash('md5').update(filterString).digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * Get cached data
   * @param key - Cache key
   * @returns Cached data or null
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // Cache errors should be logged but not stop the application
      const log = await loggingService.logBlockchainOperation('cache_get', { key });
      await loggingService.logBlockchainError(log, { error, context: 'Cache get failed' });
      return null;
    }
  }

  /**
   * Set cached data with TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlSeconds - Time to live in seconds
   */
  async set(key: string, data: unknown, ttlSeconds = 60): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      // Cache errors should be logged but not stop the application
      const log = await loggingService.logBlockchainOperation('cache_set', { key, ttlSeconds });
      await loggingService.logBlockchainError(log, { error, context: 'Cache set failed' });
    }
  }

  /**
   * Delete cached data
   * @param key - Cache key
   */
  async delete(key: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      // Cache errors should be logged but not stop the application
      const log = await loggingService.logBlockchainOperation('cache_delete', { key });
      await loggingService.logBlockchainError(log, { error, context: 'Cache delete failed' });
    }
  }

  /**
   * Delete all keys matching pattern
   * @param pattern - Key pattern to match
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      // Cache errors should be logged but not stop the application
      const log = await loggingService.logBlockchainOperation('cache_delete_pattern', { pattern });
      await loggingService.logBlockchainError(log, {
        error,
        context: 'Cache delete pattern failed',
      });
    }
  }

  /**
   * Cache location suggestions
   * @param query - Search query
   * @param limit - Result limit
   * @param data - Data to cache
   * @param ttlSeconds - TTL in seconds (default: 60)
   */
  async cacheLocationSuggestions(
    query: string,
    limit: number,
    data: unknown,
    ttlSeconds = 60
  ): Promise<void> {
    const key = this.generateCacheKey('search:location', { query, limit });
    await this.set(key, data, ttlSeconds);
  }

  /**
   * Get cached location suggestions
   * @param query - Search query
   * @param limit - Result limit
   * @returns Cached data or null
   */
  async getCachedLocationSuggestions(query: string, limit: number): Promise<unknown | null> {
    const key = this.generateCacheKey('search:location', { query, limit });
    return await this.get(key);
  }

  /**
   * Cache popular locations
   * @param limit - Result limit
   * @param data - Data to cache
   * @param ttlSeconds - TTL in seconds (default: 300 - 5 minutes)
   */
  async cachePopularLocations(limit: number, data: unknown, ttlSeconds = 300): Promise<void> {
    const key = this.generateCacheKey('search:popular', { limit });
    await this.set(key, data, ttlSeconds);
  }

  /**
   * Get cached popular locations
   * @param limit - Result limit
   * @returns Cached data or null
   */
  async getCachedPopularLocations(limit: number): Promise<unknown | null> {
    const key = this.generateCacheKey('search:popular', { limit });
    return await this.get(key);
  }

  /**
   * Cache property search results
   * @param filters - Search filters
   * @param options - Search options
   * @param data - Data to cache
   * @param ttlSeconds - TTL in seconds (default: 180 - 3 minutes)
   */
  async cachePropertySearch(
    filters: Record<string, unknown>,
    options: Record<string, unknown>,
    data: unknown,
    ttlSeconds = 180
  ): Promise<void> {
    const key = this.generateCacheKey('search:properties', {
      ...filters,
      ...options,
    });
    await this.set(key, data, ttlSeconds);
  }

  /**
   * Get cached property search results
   * @param filters - Search filters
   * @param options - Search options
   * @returns Cached data or null
   */
  async getCachedPropertySearch(
    filters: Record<string, unknown>,
    options: Record<string, unknown>
  ): Promise<unknown | null> {
    const key = this.generateCacheKey('search:properties', {
      ...filters,
      ...options,
    });
    return await this.get(key);
  }

  /**
   * Invalidate all search caches (call when properties are updated)
   */
  async invalidateSearchCaches(): Promise<void> {
    await this.deletePattern('search:*');
  }

  /**
   * Invalidate location caches (call when properties are updated)
   */
  async invalidateLocationCaches(): Promise<void> {
    await this.deletePattern('search:location:*');
    await this.deletePattern('search:popular:*');
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  async getStats(): Promise<{
    isConnected: boolean;
    memoryUsage?: string;
    keyCount?: number;
  }> {
    if (!this.isConnected) {
      return { isConnected: false };
    }

    try {
      const info = await this.client.info('memory');
      const memoryUsage = info.match(/used_memory_human:([^\r\n]+)/)?.[1];
      const keyCount = await this.client.dbSize();

      return {
        isConnected: true,
        memoryUsage,
        keyCount,
      };
    } catch (error) {
      // Cache errors should be logged but not stop the application
      const log = await loggingService.logBlockchainOperation('cache_stats', {});
      await loggingService.logBlockchainError(log, { error, context: 'Cache stats failed' });
      return { isConnected: true };
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
