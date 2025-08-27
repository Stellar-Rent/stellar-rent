import { createHash } from 'node:crypto';
import Redis from 'ioredis';

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  maxRetriesPerRequest: number;
  retryDelayOnFailover: number;
  connectTimeout: number;
  commandTimeout: number;
}

class CacheService {
  private redis: Redis;
  private isConnected = false;

  constructor() {
    const config: CacheConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: Number.parseInt(process.env.REDIS_DB || '0', 10),
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      connectTimeout: 10000,
      commandTimeout: 5000,
    };

    this.redis = new Redis(config);

    this.redis.on('connect', () => {
      console.log('Redis connected');
      this.isConnected = true;
    });

    this.redis.on('error', (err) => {
      console.error('Redis connection error:', err);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      console.log('Redis connection closed');
      this.isConnected = false;
    });
  }

  generateSearchKey(filters: Record<string, any>, options: Record<string, any>): string {
    const searchData = { filters, options };
    const hash = createHash('md5').update(JSON.stringify(searchData)).digest('hex');
    return `search:${hash}`;
  }

  generateLocationKey(query: string, limit: number): string {
    const hash = createHash('md5').update(`${query}:${limit}`).digest('hex');
    return `location:${hash}`;
  }

  generatePopularLocationsKey(limit: number): string {
    return `popular_locations:${limit}`;
  }

  generatePropertyKey(propertyId: string): string {
    return `property:${propertyId}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache get');
      return null;
    }

    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached data with TTL (Time To Live)
   */
  async set<T>(key: string, data: T, ttlSeconds = 300): Promise<boolean> {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache set');
      return false;
    }

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache delete');
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache delete pattern');
      return 0;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;

      const deletedCount = await this.redis.del(...keys);
      return deletedCount;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  /**
   * Invalidate search caches when properties are modified
   */
  async invalidatePropertyCaches(propertyId?: string): Promise<void> {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache invalidation');
      return;
    }

    try {
      // Delete search caches
      await this.deletePattern('search:*');
      await this.deletePattern('location:*');
      await this.deletePattern('popular_locations:*');

      // Delete specific property cache if provided
      if (propertyId) {
        await this.delete(this.generatePropertyKey(propertyId));
      }

      console.log('Property caches invalidated');
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  async cacheSearchAnalytics(
    queryHash: string,
    resultCount: number,
    responseTime: number,
    userId?: string
  ): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const analyticsKey = `analytics:${queryHash}:${Date.now()}`;
      const analyticsData = {
        queryHash,
        resultCount,
        responseTime,
        userId,
        timestamp: new Date().toISOString(),
      };

      await this.set(analyticsKey, analyticsData, 7 * 24 * 60 * 60);
      return true;
    } catch (error) {
      console.error('Analytics cache error:', error);
      return false;
    }
  }

  async getStats(): Promise<{
    connected: boolean;
    memory: string;
    keys: number;
    hits: string;
    misses: string;
  } | null> {
    if (!this.isConnected) {
      return {
        connected: false,
        memory: '0',
        keys: 0,
        hits: '0',
        misses: '0',
      };
    }

    try {
      const info = await this.redis.info('memory');
      const keyCount = await this.redis.dbsize();
      const stats = await this.redis.info('stats');

      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : '0';

      const hitsMatch = stats.match(/keyspace_hits:(\d+)/);
      const missesMatch = stats.match(/keyspace_misses:(\d+)/);
      const hits = hitsMatch ? hitsMatch[1] : '0';
      const misses = missesMatch ? missesMatch[1] : '0';

      return {
        connected: this.isConnected,
        memory,
        keys: keyCount,
        hits,
        misses,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.redis.ping();
      return response === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export const cacheService = new CacheService();
export default cacheService;
