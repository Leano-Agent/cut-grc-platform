import jwt from 'jsonwebtoken';
import config from '../config/config';
import { Redis } from 'ioredis';
import logger from '../config/logger';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export class JWTService {
  private static readonly ACCESS_TOKEN_EXPIRY = config.jwt.expiresIn;
  private static readonly REFRESH_TOKEN_EXPIRY = config.jwt.refreshExpiresIn;
  
  /**
   * Generate access token
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
      payload,
      config.jwt.secret,
      { 
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        algorithm: 'HS256'
      }
    );
  }
  
  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(
      payload,
      config.jwt.refreshSecret,
      { 
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        algorithm: 'HS256'
      }
    );
  }
  
  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] }) as TokenPayload;
    } catch (error) {
      logger.error('Access token verification failed:', error);
      return null;
    }
  }
  
  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      return jwt.verify(token, config.jwt.refreshSecret, { algorithms: ['HS256'] }) as RefreshTokenPayload;
    } catch (error) {
      logger.error('Refresh token verification failed:', error);
      return null;
    }
  }
  
  /**
   * Decode token without verification (for debugging/logging only)
   */
  static decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Token decoding failed:', error);
      return null;
    }
  }
  
  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }
  
  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return null;
      
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }
}

/**
 * Token blacklist management using Redis
 */
export class TokenBlacklist {
  private redis: Redis;
  
  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }
  
  /**
   * Add token to blacklist
   */
  async addToBlacklist(token: string, expirySeconds: number): Promise<void> {
    const key = `blacklist:token:${token}`;
    await this.redis.setex(key, expirySeconds, '1');
  }
  
  /**
   * Check if token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:token:${token}`;
    const result = await this.redis.get(key);
    return result === '1';
  }
  
  /**
   * Remove token from blacklist
   */
  async removeFromBlacklist(token: string): Promise<void> {
    const key = `blacklist:token:${token}`;
    await this.redis.del(key);
  }
  
  /**
   * Add user's refresh token version (for logout all devices)
   */
  async incrementRefreshTokenVersion(userId: string): Promise<number> {
    const key = `user:${userId}:refreshTokenVersion`;
    const newVersion = await this.redis.incr(key);
    return newVersion;
  }
  
  /**
   * Get user's refresh token version
   */
  async getRefreshTokenVersion(userId: string): Promise<number> {
    const key = `user:${userId}:refreshTokenVersion`;
    const version = await this.redis.get(key);
    return version ? parseInt(version, 10) : 0;
  }
}

export default JWTService;