import { type RedisClientType, createClient } from 'redis';
import { z } from 'zod';

// Cache configuration
const CACHE_CONFIG = {
  TTL: {
    SEARCH_RESULTS: 300, // 5 minutes
    LOCATION_SUGGESTIONS: 600, // 10 minutes
    POPULAR_LOCATIONS: 1800, // 30 minutes
    PROPERTY_DETAILS: 900, // 15 minutes
    AMENITIES_LIST: 3600, // 1 hour
  },
  PREFIXES: {
    SEARCH: 'search:',
    LOCATION: 'location:',
    PROPERTY: 'property:',
    AMENITIES: 'amenities:',
    POPULAR: 'popular:',
  },
} as const;

// Cache key schemas
const cacheKeySchema = z.object({
  type: z.enum(['search', 'location', 'property', 'amenities', 'popular']),
  query: z.string(),
  filters: z.record(z.unknown()).optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

type CacheKey = z.infer<typeof cacheKeySchema>;

export class CacheService {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis connection failed after 10 retries');
            return false;
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('❌ Redis disconnected');
      this.isConnected = false;
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
      } catch (error) {
        console.error('Failed to connect to Redis:', error);
        // Don't throw - allow application to continue without cache
      }
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  /**
   * Generate cache key
   */
  private generateKey(keyData: CacheKey): string {
    const { type, query, filters, page, limit } = keyData;
    const prefix = CACHE_CONFIG.PREFIXES[type.toUpperCase() as keyof typeof CACHE_CONFIG.PREFIXES];

    let key = `${prefix}${query}`;

    if (filters && Object.keys(filters).length > 0) {
      const filterString = JSON.stringify(filters);
      key += `:filters:${Buffer.from(filterString).toString('base64')}`;
    }

    if (page) key += `:page:${page}`;
    if (limit) key += `:limit:${limit}`;

    return key;
  }

  /**
   * Get TTL for cache type
   */
  private getTTL(type: CacheKey['type']): number {
    const ttlKey = type.toUpperCase() as keyof typeof CACHE_CONFIG.TTL;
    return CACHE_CONFIG.TTL[ttlKey] || CACHE_CONFIG.TTL.SEARCH_RESULTS;
  }

  /**
   * Set cache value
   */
  async set<T>(keyData: CacheKey, value: T): Promise<void> {
    if (!this.isConnected) return;

    try {
      const key = this.generateKey(keyData);
      const ttl = this.getTTL(keyData.type);

      await this.client.setEx(key, ttl, JSON.stringify(value));
      console.log(`💾 Cached: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Get cache value
   */
  async get<T>(keyData: CacheKey): Promise<T | null> {
    if (!this.isConnected) return null;

    try {
      const key = this.generateKey(keyData);
      const value = await this.client.get(key);

      if (value) {
        console.log(`📖 Cache hit: ${key}`);
        return JSON.parse(value) as T;
      }

      console.log(`❌ Cache miss: ${key}`);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete cache value
   */
  async delete(keyData: CacheKey): Promise<void> {
    if (!this.isConnected) return;

    try {
      const key = this.generateKey(keyData);
      await this.client.del(key);
      console.log(`🗑️ Deleted cache: ${key}`);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.flushDb();
      console.log('🧹 Cleared all cache');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    memory: string;
    keys: number;
  }> {
    if (!this.isConnected) {
      return {
        connected: false,
        memory: '0',
        keys: 0,
      };
    }

    try {
      const info = await this.client.info('memory');
      const keys = await this.client.dbSize();

      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memory = memoryMatch ? memoryMatch[1] : '0';

      return {
        connected: true,
        memory,
        keys,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        connected: false,
        memory: '0',
        keys: 0,
      };
    }
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(
    query: string,
    filters: Record<string, unknown>,
    page: number,
    limit: number,
    results: unknown
  ): Promise<void> {
    await this.set({ type: 'search', query, filters, page, limit }, results);
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(
    query: string,
    filters: Record<string, unknown>,
    page: number,
    limit: number
  ): Promise<unknown | null> {
    return this.get({ type: 'search', query, filters, page, limit });
  }

  /**
   * Cache location suggestions
   */
  async cacheLocationSuggestions(
    query: string,
    limit: number,
    suggestions: unknown
  ): Promise<void> {
    await this.set({ type: 'location', query, limit }, suggestions);
  }

  /**
   * Get cached location suggestions
   */
  async getCachedLocationSuggestions(query: string, limit: number): Promise<unknown | null> {
    return this.get({ type: 'location', query, limit });
  }

  /**
   * Cache popular locations
   */
  async cachePopularLocations(limit: number, locations: unknown): Promise<void> {
    await this.set({ type: 'popular', query: 'popular', limit }, locations);
  }

  /**
   * Get cached popular locations
   */
  async getCachedPopularLocations(limit: number): Promise<unknown | null> {
    return this.get({ type: 'popular', query: 'popular', limit });
  }

  /**
   * Invalidate search cache when properties are updated
   */
  async invalidateSearchCache(): Promise<void> {
    if (!this.isConnected) return;

    try {
      const keys = await this.client.keys(`${CACHE_CONFIG.PREFIXES.SEARCH}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`🗑️ Invalidated ${keys.length} search cache entries`);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate location cache when properties are updated
   */
  async invalidateLocationCache(): Promise<void> {
    if (!this.isConnected) return;

    try {
      const keys = await this.client.keys(`${CACHE_CONFIG.PREFIXES.LOCATION}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`🗑️ Invalidated ${keys.length} location cache entries`);
      }
    } catch (error) {
      console.error('Location cache invalidation error:', error);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
