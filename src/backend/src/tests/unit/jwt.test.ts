import { JWTService, TokenPayload, RefreshTokenPayload, TokenBlacklist } from '../../utils/jwt';
import config from '../../config/config';
import { Redis } from 'ioredis';

// Mock Redis
jest.mock('ioredis');
const MockRedis = Redis as jest.MockedClass<typeof Redis>;

describe('JWTService', () => {
  const mockTokenPayload: TokenPayload = {
    userId: '123456',
    email: 'test@example.com',
    role: 'admin',
    permissions: ['read:users', 'write:users']
  };

  const mockRefreshTokenPayload: RefreshTokenPayload = {
    userId: '123456',
    tokenVersion: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = JWTService.generateAccessToken(mockTokenPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include all payload fields in the token', () => {
      const token = JWTService.generateAccessToken(mockTokenPayload);
      const decoded = JWTService.decodeToken(token);
      
      expect(decoded).toMatchObject({
        userId: mockTokenPayload.userId,
        email: mockTokenPayload.email,
        role: mockTokenPayload.role
      });
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = JWTService.generateRefreshToken(mockRefreshTokenPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = JWTService.generateAccessToken(mockTokenPayload);
      const verified = JWTService.verifyAccessToken(token);
      
      expect(verified).toBeDefined();
      expect(verified).toMatchObject(mockTokenPayload);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const verified = JWTService.verifyAccessToken(invalidToken);
      
      expect(verified).toBeNull();
    });

    it('should return null for expired token', () => {
      // Create a token with immediate expiration
      const expiredToken = jwt.sign(
        mockTokenPayload,
        config.jwt.secret,
        { expiresIn: '0s', algorithm: 'HS256' }
      );
      
      // Wait a bit for token to expire
      setTimeout(() => {
        const verified = JWTService.verifyAccessToken(expiredToken);
        expect(verified).toBeNull();
      }, 100);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = JWTService.generateRefreshToken(mockRefreshTokenPayload);
      const verified = JWTService.verifyRefreshToken(token);
      
      expect(verified).toBeDefined();
      expect(verified).toMatchObject(mockRefreshTokenPayload);
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = JWTService.generateAccessToken(mockTokenPayload);
      const decoded = JWTService.decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockTokenPayload.userId);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = JWTService.generateAccessToken(mockTokenPayload);
      const isExpired = JWTService.isTokenExpired(token);
      
      expect(isExpired).toBe(false);
    });

    it('should return true for expired token', () => {
      const expiredToken = jwt.sign(
        mockTokenPayload,
        config.jwt.secret,
        { expiresIn: '0s', algorithm: 'HS256' }
      );
      
      setTimeout(() => {
        const isExpired = JWTService.isTokenExpired(expiredToken);
        expect(isExpired).toBe(true);
      }, 100);
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration date for valid token', () => {
      const token = JWTService.generateAccessToken(mockTokenPayload);
      const expiration = JWTService.getTokenExpiration(token);
      
      expect(expiration).toBeInstanceOf(Date);
      expect(expiration!.getTime()).toBeGreaterThan(Date.now());
    });
  });
});

describe('TokenBlacklist', () => {
  let tokenBlacklist: TokenBlacklist;
  let mockRedisInstance: jest.Mocked<Redis>;

  beforeEach(() => {
    mockRedisInstance = {
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      incr: jest.fn().mockResolvedValue(2),
    } as any;

    MockRedis.mockImplementation(() => mockRedisInstance);
    tokenBlacklist = new TokenBlacklist(mockRedisInstance);
  });

  describe('addToBlacklist', () => {
    it('should add token to blacklist with expiry', async () => {
      const token = 'test-token';
      const expirySeconds = 3600;
      
      await tokenBlacklist.addToBlacklist(token, expirySeconds);
      
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        `blacklist:token:${token}`,
        expirySeconds,
        '1'
      );
    });
  });

  describe('isBlacklisted', () => {
    it('should return false for non-blacklisted token', async () => {
      mockRedisInstance.get.mockResolvedValue(null);
      
      const isBlacklisted = await tokenBlacklist.isBlacklisted('test-token');
      
      expect(isBlacklisted).toBe(false);
      expect(mockRedisInstance.get).toHaveBeenCalledWith('blacklist:token:test-token');
    });

    it('should return true for blacklisted token', async () => {
      mockRedisInstance.get.mockResolvedValue('1');
      
      const isBlacklisted = await tokenBlacklist.isBlacklisted('test-token');
      
      expect(isBlacklisted).toBe(true);
    });
  });

  describe('removeFromBlacklist', () => {
    it('should remove token from blacklist', async () => {
      await tokenBlacklist.removeFromBlacklist('test-token');
      
      expect(mockRedisInstance.del).toHaveBeenCalledWith('blacklist:token:test-token');
    });
  });

  describe('incrementRefreshTokenVersion', () => {
    it('should increment refresh token version', async () => {
      mockRedisInstance.incr.mockResolvedValue(2);
      
      const newVersion = await tokenBlacklist.incrementRefreshTokenVersion('user-123');
      
      expect(newVersion).toBe(2);
      expect(mockRedisInstance.incr).toHaveBeenCalledWith('user:user-123:refreshTokenVersion');
    });
  });

  describe('getRefreshTokenVersion', () => {
    it('should return refresh token version', async () => {
      mockRedisInstance.get.mockResolvedValue('5');
      
      const version = await tokenBlacklist.getRefreshTokenVersion('user-123');
      
      expect(version).toBe(5);
    });

    it('should return 0 when no version exists', async () => {
      mockRedisInstance.get.mockResolvedValue(null);
      
      const version = await tokenBlacklist.getRefreshTokenVersion('user-123');
      
      expect(version).toBe(0);
    });
  });
});

// Import jwt for manual token creation in tests
import jwt from 'jsonwebtoken';