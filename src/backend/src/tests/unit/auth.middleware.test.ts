import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { JWTService, TokenBlacklist } from '../../utils/jwt';
import { Redis } from 'ioredis';

// Mock dependencies
jest.mock('../../utils/jwt');
jest.mock('ioredis');

const MockJWTService = JWTService as jest.Mocked<typeof JWTService>;
const MockTokenBlacklist = TokenBlacklist as jest.MockedClass<typeof TokenBlacklist>;
const MockRedis = Redis as jest.MockedClass<typeof Redis>;

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let mockTokenBlacklistInstance: jest.Mocked<TokenBlacklist>;
  let mockRedisInstance: jest.Mocked<Redis>;

  const mockUserPayload = {
    userId: '123456',
    email: 'test@example.com',
    role: 'admin',
    permissions: ['read:users', 'write:users']
  };

  const validToken = 'valid.jwt.token';
  const invalidToken = 'invalid.jwt.token';
  const expiredToken = 'expired.jwt.token';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Redis mock
    mockRedisInstance = {
      // Mock Redis methods as needed
    } as any;
    
    // Setup TokenBlacklist mock
    mockTokenBlacklistInstance = {
      isBlacklisted: jest.fn().mockResolvedValue(false),
      addToBlacklist: jest.fn().mockResolvedValue(undefined),
    } as any;
    
    MockTokenBlacklist.mockImplementation(() => mockTokenBlacklistInstance);
    
    // Create auth middleware instance
    authMiddleware = new AuthMiddleware(mockRedisInstance);
    
    // Setup request, response, and next function
    mockRequest = {
      headers: {},
      user: undefined
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
  });

  describe('verifyToken', () => {
    it('should return 401 if no authorization header', async () => {
      mockRequest.headers = {};
      
      await authMiddleware.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required. No token provided.',
        code: 'NO_TOKEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header does not start with Bearer', async () => {
      mockRequest.headers = { authorization: 'InvalidScheme token' };
      
      await authMiddleware.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required. No token provided.',
        code: 'NO_TOKEN'
      });
    });

    it('should return 401 if token is blacklisted', async () => {
      mockRequest.headers = { authorization: 'Bearer ' + validToken };
      mockTokenBlacklistInstance.isBlacklisted.mockResolvedValue(true);
      
      await authMiddleware.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token has been revoked. Please login again.',
        code: 'TOKEN_REVOKED'
      });
      expect(mockTokenBlacklistInstance.isBlacklisted).toHaveBeenCalledWith(validToken);
    });

    it('should return 401 if token verification fails', async () => {
      mockRequest.headers = { authorization: 'Bearer ' + invalidToken };
      MockJWTService.verifyAccessToken.mockReturnValue(null);
      
      await authMiddleware.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token. Please login again.',
        code: 'INVALID_TOKEN'
      });
    });

    it('should return 401 if token is expired', async () => {
      mockRequest.headers = { authorization: 'Bearer ' + expiredToken };
      MockJWTService.verifyAccessToken.mockReturnValue(mockUserPayload);
      MockJWTService.isTokenExpired.mockReturnValue(true);
      
      await authMiddleware.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    });

    it('should attach user to request and call next for valid token', async () => {
      mockRequest.headers = { authorization: 'Bearer ' + validToken };
      MockJWTService.verifyAccessToken.mockReturnValue(mockUserPayload);
      MockJWTService.isTokenExpired.mockReturnValue(false);
      
      await authMiddleware.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockRequest.user).toEqual(mockUserPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle internal server error', async () => {
      mockRequest.headers = { authorization: 'Bearer ' + validToken };
      mockTokenBlacklistInstance.isBlacklisted.mockRejectedValue(new Error('Redis error'));
      
      await authMiddleware.verifyToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error during authentication.',
        code: 'AUTH_ERROR'
      });
    });
  });

  describe('requireRole', () => {
    it('should return 401 if no user is authenticated', () => {
      const middleware = authMiddleware.requireRole('admin');
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required.',
        code: 'NO_AUTH'
      });
    });

    it('should return 403 if user does not have required role', () => {
      mockRequest.user = { ...mockUserPayload, role: 'user' };
      const middleware = authMiddleware.requireRole('admin');
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions. Required role: admin',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    });

    it('should call next if user has required role', () => {
      mockRequest.user = mockUserPayload;
      const middleware = authMiddleware.requireRole('admin');
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('requireAnyRole', () => {
    it('should return 401 if no user is authenticated', () => {
      const middleware = authMiddleware.requireAnyRole(['admin', 'supervisor']);
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 if user does not have any allowed role', () => {
      mockRequest.user = { ...mockUserPayload, role: 'user' };
      const middleware = authMiddleware.requireAnyRole(['admin', 'supervisor']);
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions. Allowed roles: admin, supervisor',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    });

    it('should call next if user has any allowed role', () => {
      mockRequest.user = { ...mockUserPayload, role: 'admin' };
      const middleware = authMiddleware.requireAnyRole(['admin', 'supervisor']);
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('should return 401 if no user is authenticated', () => {
      const middleware = authMiddleware.requirePermission('read:users');
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 if user does not have required permission', () => {
      mockRequest.user = { ...mockUserPayload, permissions: ['write:users'] };
      const middleware = authMiddleware.requirePermission('read:users');
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions. Required: read:users',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    });

    it('should call next if user has required permission', () => {
      mockRequest.user = mockUserPayload;
      const middleware = authMiddleware.requirePermission('read:users');
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAnyPermission', () => {
    it('should return 401 if no user is authenticated', () => {
      const middleware = authMiddleware.requireAnyPermission(['read:users', 'write:users']);
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 if user does not have any allowed permission', () => {
      mockRequest.user = { ...mockUserPayload, permissions: ['delete:users'] };
      const middleware = authMiddleware.requireAnyPermission(['read:users', 'write:users']);
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions. Required one of: read:users, write:users',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    });

    it('should call next if user has any allowed permission', () => {
      mockRequest.user = mockUserPayload;
      const middleware = authMiddleware.requireAnyPermission(['read:users', 'write:users']);
      
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should call next without setting user if no authorization header', async () => {
      mockRequest.headers = {};
      
      await authMiddleware.optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not set user if token is blacklisted', async () => {
      mockRequest.headers = { authorization: 'Bearer ' + validToken };
      mockTokenBlacklistInstance.isBlacklisted.mockResolvedValue(true);
      
      await authMiddleware.optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should set user if valid token is provided', async () => {
      mockRequest.headers = { authorization: 'Bearer ' + validToken };
      mockTokenBlacklistInstance.isBlacklisted.mockResolvedValue(false);
      MockJWTService.verifyAccessToken.mockReturnValue(mockUserPayload);
      MockJWTService.isTokenExpired.mockReturnValue(false);
      
      await authMiddleware.optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockRequest.user).toEqual(mockUserPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not fail on token verification error', async () => {
      mockRequest.headers = { authorization: 'Bearer ' + invalidToken };
      mockTokenBlacklistInstance.isBlacklisted.mockRejectedValue(new Error('Redis error'));
      
      await authMiddleware.optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should blacklist token if authorization header exists', async () => {
      mockRequest.headers = { authorization: 'Bearer ' + validToken };
      mockRequest.user = mockUserPayload;
      MockJWTService.getTokenExpiration.mockReturnValue(new Date(Date.now() + 3600000));
      
      await authMiddleware.logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockTokenBlacklistInstance.addToBlacklist).toHaveBeenCalledWith(
        validToken,
        expect.any(Number)
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next without error if no authorization header', async () => {
      mockRequest.headers = {};
      
      await authMiddleware.logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockTokenBlacklistInstance.addToBlacklist).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockRequest.headers = { authorization: 'Bearer ' + validToken };
      MockJWTService.getTokenExpiration.mockReturnValue(null);
      
      await authMiddleware.logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
    });
  });
});