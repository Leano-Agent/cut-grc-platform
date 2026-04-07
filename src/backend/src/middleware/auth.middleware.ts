import { Request, Response, NextFunction } from 'express';
import { JWTService, TokenBlacklist } from '../utils/jwt';
import logger from '../config/logger';
import { Redis } from 'ioredis';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        permissions: string[];
      };
    }
  }
}

export class AuthMiddleware {
  private tokenBlacklist: TokenBlacklist;
  
  constructor(redisClient: Redis) {
    this.tokenBlacklist = new TokenBlacklist(redisClient);
  }
  
  /**
   * Middleware to verify JWT token
   */
  verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'Authentication required. No token provided.',
          code: 'NO_TOKEN'
        });
        return;
      }
      
      const token = authHeader.split(' ')[1];
      
      // Check if token is blacklisted
      const isBlacklisted = await this.tokenBlacklist.isBlacklisted(token);
      if (isBlacklisted) {
        res.status(401).json({
          success: false,
          error: 'Token has been revoked. Please login again.',
          code: 'TOKEN_REVOKED'
        });
        return;
      }
      
      // Verify token
      const payload = JWTService.verifyAccessToken(token);
      if (!payload) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token. Please login again.',
          code: 'INVALID_TOKEN'
        });
        return;
      }
      
      // Check if token is expired
      if (JWTService.isTokenExpired(token)) {
        res.status(401).json({
          success: false,
          error: 'Token has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }
      
      // Attach user to request
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions
      };
      
      next();
    } catch (error) {
      logger.error('Token verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during authentication.',
        code: 'AUTH_ERROR'
      });
    }
  };
  
  /**
   * Middleware to require specific role
   */
  requireRole = (requiredRole: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
          code: 'NO_AUTH'
        });
        return;
      }
      
      if (req.user.role !== requiredRole) {
        res.status(403).json({
          success: false,
          error: `Insufficient permissions. Required role: ${requiredRole}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }
      
      next();
    };
  };
  
  /**
   * Middleware to require any of the specified roles
   */
  requireAnyRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
          code: 'NO_AUTH'
        });
        return;
      }
      
      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: `Insufficient permissions. Allowed roles: ${allowedRoles.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }
      
      next();
    };
  };
  
  /**
   * Middleware to require specific permission
   */
  requirePermission = (requiredPermission: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
          code: 'NO_AUTH'
        });
        return;
      }
      
      if (!req.user.permissions.includes(requiredPermission)) {
        res.status(403).json({
          success: false,
          error: `Insufficient permissions. Required: ${requiredPermission}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }
      
      next();
    };
  };
  
  /**
   * Middleware to require any of the specified permissions
   */
  requireAnyPermission = (allowedPermissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
          code: 'NO_AUTH'
        });
        return;
      }
      
      const hasPermission = req.user.permissions.some(permission => 
        allowedPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: `Insufficient permissions. Required one of: ${allowedPermissions.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }
      
      next();
    };
  };
  
  /**
   * Middleware for optional authentication (sets user if token exists)
   */
  optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        
        // Check if token is blacklisted
        const isBlacklisted = await this.tokenBlacklist.isBlacklisted(token);
        if (!isBlacklisted) {
          const payload = JWTService.verifyAccessToken(token);
          if (payload && !JWTService.isTokenExpired(token)) {
            req.user = {
              userId: payload.userId,
              email: payload.email,
              role: payload.role,
              permissions: payload.permissions
            };
          }
        }
      }
      
      next();
    } catch (error) {
      // Don't fail on optional auth errors, just continue without user
      logger.debug('Optional auth error (non-critical):', error);
      next();
    }
  };
  
  /**
   * Logout middleware - blacklist token
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        
        // Get token expiration
        const expiration = JWTService.getTokenExpiration(token);
        if (expiration) {
          const now = new Date();
          const expirySeconds = Math.max(1, Math.floor((expiration.getTime() - now.getTime()) / 1000));
          
          // Add to blacklist
          await this.tokenBlacklist.addToBlacklist(token, expirySeconds);
          
          logger.info(`Token blacklisted for user: ${req.user?.userId}`);
        }
      }
      
      next();
    } catch (error) {
      logger.error('Logout middleware error:', error);
      next();
    }
  };
}

export default AuthMiddleware;