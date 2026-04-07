import { createClient, RedisClientType } from 'redis';
import config from './config';
import logger from '../utils/logger';

/**
 * Redis configuration for CUT GRC Platform
 * Supports caching, sessions, and real-time features
 */

class RedisClient {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    // Create Redis client with configuration
    this.client = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis connection failed after 10 retries');
            return new Error('Max retries reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
      password: config.redis.password,
      name: 'cut-grc-backend',
    });

    // Setup event handlers
    this.setupEventHandlers();
  }

  /**
   * Setup Redis event handlers
   */
  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('Redis client ready');
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.warn('Redis client disconnected');
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error', { error });
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.client.connect();
      this.isConnected = true;
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis', { error });
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from Redis', { error });
      throw error;
    }
  }

  /**
   * Check Redis health
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      await this.client.ping();
      const latency = Date.now() - startTime;
      
      return {
        healthy: true,
        message: 'Redis connection healthy',
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Redis connection failed',
        latency,
      };
    }
  }

  /**
   * Get Redis statistics
   */
  async getStats(): Promise<Record<string, any>> {
    try {
      const info = await this.client.info();
      const stats: Record<string, any> = {};
      
      // Parse INFO command output
      const lines = info.split('\r\n');
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          if (key && value) {
            stats[key.trim()] = value.trim();
          }
        }
      }
      
      return stats;
    } catch (error) {
      logger.error('Failed to get Redis stats', { error });
      throw error;
    }
  }

  /**
   * Cache operations
   */

  /**
   * Set cache value with TTL
   */
  async setCache(
    key: string,
    value: any,
    ttlSeconds: number = 3600
  ): Promise<void> {
    const cacheKey = `${config.redis.keyPrefix}cache:${key}`;
    
    try {
      const serializedValue = JSON.stringify(value);
      await this.client.set(cacheKey, serializedValue, { EX: ttlSeconds });
      
      logger.debug('Cache set', { key: cacheKey, ttlSeconds });
    } catch (error) {
      logger.error('Failed to set cache', { key, error });
      throw error;
    }
  }

  /**
   * Get cache value
   */
  async getCache<T = any>(key: string): Promise<T | null> {
    const cacheKey = `${config.redis.keyPrefix}cache:${key}`;
    
    try {
      const value = await this.client.get(cacheKey);
      
      if (value === null) {
        return null;
      }
      
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Failed to get cache', { key, error });
      return null;
    }
  }

  /**
   * Delete cache value
   */
  async deleteCache(key: string): Promise<void> {
    const cacheKey = `${config.redis.keyPrefix}cache:${key}`;
    
    try {
      await this.client.del(cacheKey);
      logger.debug('Cache deleted', { key: cacheKey });
    } catch (error) {
      logger.error('Failed to delete cache', { key, error });
      throw error;
    }
  }

  /**
   * Clear cache by pattern
   */
  async clearCacheByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(`${config.redis.keyPrefix}cache:${pattern}`);
      
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.debug('Cache cleared by pattern', { pattern, keysCount: keys.length });
      }
    } catch (error) {
      logger.error('Failed to clear cache by pattern', { pattern, error });
      throw error;
    }
  }

  /**
   * Session operations
   */

  /**
   * Create or update session
   */
  async setSession(
    sessionId: string,
    data: any,
    ttlSeconds: number = 86400 // 24 hours
  ): Promise<void> {
    const sessionKey = `${config.redis.keyPrefix}session:${sessionId}`;
    
    try {
      const serializedData = JSON.stringify(data);
      await this.client.set(sessionKey, serializedData, { EX: ttlSeconds });
      
      logger.debug('Session set', { sessionId, ttlSeconds });
    } catch (error) {
      logger.error('Failed to set session', { sessionId, error });
      throw error;
    }
  }

  /**
   * Get session data
   */
  async getSession<T = any>(sessionId: string): Promise<T | null> {
    const sessionKey = `${config.redis.keyPrefix}session:${sessionId}`;
    
    try {
      const data = await this.client.get(sessionKey);
      
      if (data === null) {
        return null;
      }
      
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Failed to get session', { sessionId, error });
      return null;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const sessionKey = `${config.redis.keyPrefix}session:${sessionId}`;
    
    try {
      await this.client.del(sessionKey);
      logger.debug('Session deleted', { sessionId });
    } catch (error) {
      logger.error('Failed to delete session', { sessionId, error });
      throw error;
    }
  }

  /**
   * Refresh session TTL
   */
  async refreshSession(sessionId: string, ttlSeconds: number = 86400): Promise<void> {
    const sessionKey = `${config.redis.keyPrefix}session:${sessionId}`;
    
    try {
      await this.client.expire(sessionKey, ttlSeconds);
      logger.debug('Session refreshed', { sessionId, ttlSeconds });
    } catch (error) {
      logger.error('Failed to refresh session', { sessionId, error });
      throw error;
    }
  }

  /**
   * Rate limiting
   */

  /**
   * Check rate limit
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; reset: number }> {
    const rateLimitKey = `${config.redis.keyPrefix}ratelimit:${key}`;
    
    try {
      const current = await this.client.incr(rateLimitKey);
      
      if (current === 1) {
        // First request in window, set expiry
        await this.client.expire(rateLimitKey, windowSeconds);
      }
      
      const ttl = await this.client.ttl(rateLimitKey);
      const remaining = Math.max(0, limit - current);
      const allowed = current <= limit;
      
      return {
        allowed,
        remaining,
        reset: Date.now() + ttl * 1000,
      };
    } catch (error) {
      logger.error('Failed to check rate limit', { key, error });
      // Allow request if Redis fails (fail-open)
      return {
        allowed: true,
        remaining: limit,
        reset: Date.now() + windowSeconds * 1000,
      };
    }
  }

  /**
   * Real-time features
   */

  /**
   * Publish message to channel
   */
  async publish(channel: string, message: any): Promise<void> {
    try {
      const serializedMessage = JSON.stringify(message);
      await this.client.publish(channel, serializedMessage);
      
      logger.debug('Message published', { channel });
    } catch (error) {
      logger.error('Failed to publish message', { channel, error });
      throw error;
    }
  }

  /**
   * Subscribe to channel
   */
  async subscribe(
    channel: string,
    callback: (message: any) => void
  ): Promise<void> {
    try {
      const subscriber = this.client.duplicate();
      await subscriber.connect();
      
      await subscriber.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          logger.error('Failed to parse subscribed message', { channel, error });
        }
      });
      
      logger.debug('Subscribed to channel', { channel });
    } catch (error) {
      logger.error('Failed to subscribe to channel', { channel, error });
      throw error;
    }
  }

  /**
   * Get the underlying Redis client
   */
  getClient(): RedisClientType {
    return this.client;
  }

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.isConnected;
  }
}

// Create singleton instance
const redisClient = new RedisClient();

// Export singleton and class
export { RedisClient, redisClient };
export default redisClient;