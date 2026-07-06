import { RedisClientType } from 'redis';
declare class RedisClient {
    private client;
    private isConnected;
    constructor();
    private setupEventHandlers;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<{
        healthy: boolean;
        message: string;
        latency?: number;
    }>;
    getStats(): Promise<Record<string, any>>;
    setCache(key: string, value: any, ttlSeconds?: number): Promise<void>;
    getCache<T = any>(key: string): Promise<T | null>;
    deleteCache(key: string): Promise<void>;
    clearCacheByPattern(pattern: string): Promise<void>;
    setSession(sessionId: string, data: any, ttlSeconds?: number): Promise<void>;
    getSession<T = any>(sessionId: string): Promise<T | null>;
    deleteSession(sessionId: string): Promise<void>;
    refreshSession(sessionId: string, ttlSeconds?: number): Promise<void>;
    checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{
        allowed: boolean;
        remaining: number;
        reset: number;
    }>;
    publish(channel: string, message: any): Promise<void>;
    subscribe(channel: string, callback: (message: any) => void): Promise<void>;
    getClient(): RedisClientType;
    isReady(): boolean;
}
declare const redisClient: RedisClient;
export { RedisClient, redisClient };
export default redisClient;
//# sourceMappingURL=redis.d.ts.map