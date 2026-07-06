"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.RedisClient = void 0;
const redis_1 = require("redis");
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("../utils/logger"));
class RedisClient {
    client;
    isConnected = false;
    constructor() {
        this.client = (0, redis_1.createClient)({
            socket: {
                host: config_1.default.redis.host,
                port: config_1.default.redis.port,
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger_1.default.error('Redis connection failed after 10 retries');
                        return new Error('Max retries reached');
                    }
                    return Math.min(retries * 100, 3000);
                },
            },
            password: config_1.default.redis.password,
            name: 'ngome-backend',
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.on('connect', () => {
            logger_1.default.info('Redis client connecting...');
        });
        this.client.on('ready', () => {
            this.isConnected = true;
            logger_1.default.info('Redis client ready');
        });
        this.client.on('end', () => {
            this.isConnected = false;
            logger_1.default.warn('Redis client disconnected');
        });
        this.client.on('error', (error) => {
            logger_1.default.error('Redis client error', { error });
        });
        this.client.on('reconnecting', () => {
            logger_1.default.info('Redis client reconnecting...');
        });
    }
    async connect() {
        if (this.isConnected) {
            return;
        }
        try {
            await this.client.connect();
            this.isConnected = true;
            logger_1.default.info('Redis connected successfully');
        }
        catch (error) {
            logger_1.default.error('Failed to connect to Redis', { error });
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await this.client.quit();
            this.isConnected = false;
            logger_1.default.info('Redis disconnected successfully');
        }
        catch (error) {
            logger_1.default.error('Failed to disconnect from Redis', { error });
            throw error;
        }
    }
    async healthCheck() {
        const startTime = Date.now();
        try {
            await this.client.ping();
            const latency = Date.now() - startTime;
            return {
                healthy: true,
                message: 'Redis connection healthy',
                latency,
            };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            return {
                healthy: false,
                message: error instanceof Error ? error.message : 'Redis connection failed',
                latency,
            };
        }
    }
    async getStats() {
        try {
            const info = await this.client.info();
            const stats = {};
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
        }
        catch (error) {
            logger_1.default.error('Failed to get Redis stats', { error });
            throw error;
        }
    }
    async setCache(key, value, ttlSeconds = 3600) {
        const cacheKey = `${config_1.default.redis.keyPrefix}cache:${key}`;
        try {
            const serializedValue = JSON.stringify(value);
            await this.client.set(cacheKey, serializedValue, { EX: ttlSeconds });
            logger_1.default.debug('Cache set', { key: cacheKey, ttlSeconds });
        }
        catch (error) {
            logger_1.default.error('Failed to set cache', { key, error });
            throw error;
        }
    }
    async getCache(key) {
        const cacheKey = `${config_1.default.redis.keyPrefix}cache:${key}`;
        try {
            const value = await this.client.get(cacheKey);
            if (value === null) {
                return null;
            }
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.default.error('Failed to get cache', { key, error });
            return null;
        }
    }
    async deleteCache(key) {
        const cacheKey = `${config_1.default.redis.keyPrefix}cache:${key}`;
        try {
            await this.client.del(cacheKey);
            logger_1.default.debug('Cache deleted', { key: cacheKey });
        }
        catch (error) {
            logger_1.default.error('Failed to delete cache', { key, error });
            throw error;
        }
    }
    async clearCacheByPattern(pattern) {
        try {
            const keys = await this.client.keys(`${config_1.default.redis.keyPrefix}cache:${pattern}`);
            if (keys.length > 0) {
                await this.client.del(keys);
                logger_1.default.debug('Cache cleared by pattern', { pattern, keysCount: keys.length });
            }
        }
        catch (error) {
            logger_1.default.error('Failed to clear cache by pattern', { pattern, error });
            throw error;
        }
    }
    async setSession(sessionId, data, ttlSeconds = 86400) {
        const sessionKey = `${config_1.default.redis.keyPrefix}session:${sessionId}`;
        try {
            const serializedData = JSON.stringify(data);
            await this.client.set(sessionKey, serializedData, { EX: ttlSeconds });
            logger_1.default.debug('Session set', { sessionId, ttlSeconds });
        }
        catch (error) {
            logger_1.default.error('Failed to set session', { sessionId, error });
            throw error;
        }
    }
    async getSession(sessionId) {
        const sessionKey = `${config_1.default.redis.keyPrefix}session:${sessionId}`;
        try {
            const data = await this.client.get(sessionKey);
            if (data === null) {
                return null;
            }
            return JSON.parse(data);
        }
        catch (error) {
            logger_1.default.error('Failed to get session', { sessionId, error });
            return null;
        }
    }
    async deleteSession(sessionId) {
        const sessionKey = `${config_1.default.redis.keyPrefix}session:${sessionId}`;
        try {
            await this.client.del(sessionKey);
            logger_1.default.debug('Session deleted', { sessionId });
        }
        catch (error) {
            logger_1.default.error('Failed to delete session', { sessionId, error });
            throw error;
        }
    }
    async refreshSession(sessionId, ttlSeconds = 86400) {
        const sessionKey = `${config_1.default.redis.keyPrefix}session:${sessionId}`;
        try {
            await this.client.expire(sessionKey, ttlSeconds);
            logger_1.default.debug('Session refreshed', { sessionId, ttlSeconds });
        }
        catch (error) {
            logger_1.default.error('Failed to refresh session', { sessionId, error });
            throw error;
        }
    }
    async checkRateLimit(key, limit, windowSeconds) {
        const rateLimitKey = `${config_1.default.redis.keyPrefix}ratelimit:${key}`;
        try {
            const current = await this.client.incr(rateLimitKey);
            if (current === 1) {
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
        }
        catch (error) {
            logger_1.default.error('Failed to check rate limit', { key, error });
            return {
                allowed: true,
                remaining: limit,
                reset: Date.now() + windowSeconds * 1000,
            };
        }
    }
    async publish(channel, message) {
        try {
            const serializedMessage = JSON.stringify(message);
            await this.client.publish(channel, serializedMessage);
            logger_1.default.debug('Message published', { channel });
        }
        catch (error) {
            logger_1.default.error('Failed to publish message', { channel, error });
            throw error;
        }
    }
    async subscribe(channel, callback) {
        try {
            const subscriber = this.client.duplicate();
            await subscriber.connect();
            await subscriber.subscribe(channel, (message) => {
                try {
                    const parsedMessage = JSON.parse(message);
                    callback(parsedMessage);
                }
                catch (error) {
                    logger_1.default.error('Failed to parse subscribed message', { channel, error });
                }
            });
            logger_1.default.debug('Subscribed to channel', { channel });
        }
        catch (error) {
            logger_1.default.error('Failed to subscribe to channel', { channel, error });
            throw error;
        }
    }
    getClient() {
        return this.client;
    }
    isReady() {
        return this.isConnected;
    }
}
exports.RedisClient = RedisClient;
const redisClient = new RedisClient();
exports.redisClient = redisClient;
exports.default = redisClient;
//# sourceMappingURL=redis.js.map