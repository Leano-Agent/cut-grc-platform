import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Redis } from 'ioredis';
import logger from '../config/logger';
import config from '../config/config';

/**
 * Security middleware for comprehensive protection
 */
export class SecurityMiddleware {
  private redis: Redis;
  
  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }
  
  /**
   * Enhanced Helmet configuration for security headers
   */
  static helmetConfig = () => {
    return helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.cut.ac.za"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"], // Prevent clickjacking
          upgradeInsecureRequests: [],
        },
      },
      
      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      
      // Disable X-Powered-By header
      hidePoweredBy: true,
      
      // Prevent MIME type sniffing
      noSniff: true,
      
      // XSS Protection
      xssFilter: true,
      
      // Prevent clickjacking
      frameguard: {
        action: 'deny',
      },
      
      // Referrer Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      
      // Permissions Policy
      permissionsPolicy: {
        features: {
          geolocation: ["'none'"],
          microphone: ["'none'"],
          camera: ["'none'"],
          payment: ["'none'"],
        },
      },
      
      // Cross-Origin Embedder Policy
      crossOriginEmbedderPolicy: false, // Disabled for API servers
      
      // Cross-Origin Opener Policy
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      
      // Cross-Origin Resource Policy
      crossOriginResourcePolicy: { policy: 'same-site' },
    });
  };
  
  /**
   * Enhanced rate limiting with Redis store
   */
  static rateLimiter = () => {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 900, // 15 minutes in seconds
      },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      skipSuccessfulRequests: false, // Count all requests
      skipFailedRequests: false, // Count all requests
      keyGenerator: (req) => {
        // Use IP address as key
        return req.ip || req.socket.remoteAddress || 'unknown';
      },
      handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
          success: false,
          error: 'Too many requests from this IP, please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 900,
        });
      },
    });
  };
  
  /**
   * Speed limiting for brute force protection
   */
  static speedLimiter = () => {
    return slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 50, // Allow 50 requests per 15 minutes without slowing down
      delayMs: 100, // Add 100ms of delay per request above 50
      maxDelayMs: 5000, // Maximum delay of 5 seconds
      skipSuccessfulRequests: false,
      keyGenerator: (req) => {
        return req.ip || req.socket.remoteAddress || 'unknown';
      },
      onLimitReached: (req) => {
        logger.warn(`Speed limit reached for IP: ${req.ip}`);
      },
    });
  };
  
  /**
   * Brute force protection for authentication endpoints
   */
  bruteForceProtection = () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const key = `bruteforce:${ip}:${req.path}`;
        
        // Get current attempt count
        const attempts = await this.redis.get(key);
        const attemptCount = attempts ? parseInt(attempts, 10) : 0;
        
        // Check if IP is blocked
        const blockedKey = `blocked:${ip}`;
        const isBlocked = await this.redis.get(blockedKey);
        
        if (isBlocked) {
          const ttl = await this.redis.ttl(blockedKey);
          res.status(429).json({
            success: false,
            error: `IP temporarily blocked due to too many failed attempts. Try again in ${ttl} seconds.`,
            code: 'IP_BLOCKED',
            retryAfter: ttl,
          });
          return;
        }
        
        // Increment attempt count
        await this.redis.setex(key, 900, attemptCount + 1); // 15 minutes TTL
        
        // Block IP after 10 failed attempts
        if (attemptCount >= 10) {
          await this.redis.setex(blockedKey, 3600, '1'); // Block for 1 hour
          logger.warn(`IP blocked for brute force: ${ip}`);
          
          res.status(429).json({
            success: false,
            error: 'IP temporarily blocked due to too many failed attempts. Try again in 1 hour.',
            code: 'IP_BLOCKED',
            retryAfter: 3600,
          });
          return;
        }
        
        // Add delay based on attempt count (progressive slowing)
        if (attemptCount > 5) {
          const delay = Math.min(attemptCount * 100, 5000); // Max 5 seconds
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        next();
      } catch (error) {
        logger.error('Brute force protection middleware error:', error);
        next(); // Don't block on Redis errors
      }
    };
  };
  
  /**
   * Reset brute force counter on successful authentication
   */
  resetBruteForceCounter = () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const key = `bruteforce:${ip}:${req.path}`;
        
        // Reset attempt count on successful auth
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await this.redis.del(key);
        }
        
        next();
      } catch (error) {
        logger.error('Reset brute force counter middleware error:', error);
        next();
      }
    };
  };
  
  /**
   * CORS configuration middleware
   */
  static corsConfig = () => {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Allow specific origins
      const allowedOrigins = config.corsOrigin.split(',').map(origin => origin.trim());
      const origin = req.headers.origin;
      
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else if (config.isDevelopment && origin) {
        // In development, allow any origin for testing
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }
      
      next();
    };
  };
  
  /**
   * CSRF protection middleware
   */
  csrfProtection = () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Skip CSRF for GET, HEAD, OPTIONS requests
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          next();
          return;
        }
        
        // Skip CSRF for API endpoints that use token authentication
        if (req.path.startsWith('/api/') && req.headers.authorization) {
          next();
          return;
        }
        
        // For form submissions, check CSRF token
        const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
        
        if (!csrfToken) {
          res.status(403).json({
            success: false,
            error: 'CSRF token missing',
            code: 'CSRF_TOKEN_MISSING',
          });
          return;
        }
        
        // Verify CSRF token (simplified - in production, use proper CSRF library)
        const sessionToken = req.session?.csrfToken;
        
        if (!sessionToken || csrfToken !== sessionToken) {
          res.status(403).json({
            success: false,
            error: 'Invalid CSRF token',
            code: 'CSRF_TOKEN_INVALID',
          });
          return;
        }
        
        next();
      } catch (error) {
        logger.error('CSRF protection middleware error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error during CSRF validation.',
          code: 'CSRF_VALIDATION_ERROR',
        });
      }
    };
  };
  
  /**
   * Request size limiting middleware
   */
  static requestSizeLimit = () => {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Set maximum request size (10MB)
      const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB
      
      let requestSize = 0;
      
      // Monitor request size
      req.on('data', (chunk) => {
        requestSize += chunk.length;
        
        if (requestSize > MAX_REQUEST_SIZE) {
          res.status(413).json({
            success: false,
            error: 'Request entity too large',
            code: 'REQUEST_TOO_LARGE',
            maxSize: `${MAX_REQUEST_SIZE / 1024 / 1024}MB`,
          });
          req.destroy(); // Stop receiving data
        }
      });
      
      next();
    };
  };
  
  /**
   * SQL injection protection middleware
   */
  static sqlInjectionProtection = () => {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Common SQL injection patterns
      const sqlInjectionPatterns = [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi,
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi,
        /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/gi,
        /((\%3C)|<)((\%69)|i|(\%49))((\%6D)|m|(\%4D))((\%67)|g|(\%47))[^\n]+((\%3E)|>)/gi,
        /(\%20and\%20|\%20or\%20)/gi,
        /(union\%20select|union\%20all\%20select)/gi,
        /(select\s+\*|insert\s+into|update\s+\w+\s+set|delete\s+from)/gi,
      ];
      
      const checkForSQLInjection = (value: any): boolean => {
        if (typeof value === 'string') {
          return sqlInjectionPatterns.some(pattern => pattern.test(value));
        }
        
        if (Array.isArray(value)) {
          return value.some(checkForSQLInjection);
        }
        
        if (value && typeof value === 'object') {
          return Object.values(value).some(checkForSQLInjection);
        }
        
        return false;
      };
      
      // Check body, query, and params
      if (
        checkForSQLInjection(req.body) ||
        checkForSQLInjection(req.query) ||
        checkForSQLInjection(req.params)
      ) {
        logger.warn(`Potential SQL injection attempt detected from IP: ${req.ip}`);
        res.status(400).json({
          success: false,
          error: 'Invalid input detected',
          code: 'INVALID_INPUT',
        });
        return;
      }
      
      next();
    };
  };
  
  /**
   * XSS protection middleware
   */
  static xssProtection = () => {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Common XSS patterns
      const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<\s*iframe/gi,
        /<\s*object/gi,
        /<\s*embed/gi,
        /<\s*applet/gi,
        /<\s*frame/gi,
        /<\s*frameset/gi,
        /<\s*meta/gi,
        /<\s*link/gi,
        /<\s*style/gi,
        /expression\s*\(/gi,
        /vbscript:/gi,
        /<\s*base/gi,
        /<\s*xml/gi,
        /<\s*blink/gi,
        /<\s*scriptlet/gi,
        /<\s*ilayer/gi,
        /<\s*layer/gi,
        /<\s*bgsound/gi,
        /<\s*title/gi,
        /<\s*body/gi,
      ];
      
      const checkForXSS = (value: any): boolean => {
        if (typeof value === 'string') {
          return xssPatterns.some(pattern => pattern.test(value));
        }
        
        if (Array.isArray(value)) {
          return value.some(checkForXSS);
        }
        
        if (value && typeof value === 'object') {
          return Object.values(value).some(checkForXSS);
        }
        
        return false;
      };
      
      // Check body, query, and params
      if (
        checkForXSS(req.body) ||
        checkForXSS(req.query) ||
        checkForXSS(req.params)
      ) {
        logger.warn(`Potential XSS attempt detected from IP: ${req.ip}`);
        res.status(400).json({
          success: false,
          error: 'Invalid input detected',
          code: 'INVALID_INPUT',
        });
        return;
      }
      
      next();
    };
  };
  
  /**
   * Log security events middleware
   */
  static securityLogging = () => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const originalSend = res.send;
      const startTime = Date.now();
      
      // Log request details
      res.send = function(body: any) {
        const duration = Date.now() - startTime;
        
        // Log security-relevant events
        if (res.statusCode >= 400) {
          logger.warn(`Security event: ${req.method} ${req.url} - Status: ${res.statusCode} - Duration: ${duration}ms`, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: (req as any).user?.userId,
            statusCode: res.statusCode,
            duration,
          });
        }
        
        // Log authentication failures
        if (req.path.includes('/auth') && res.statusCode >= 400) {
          logger.warn(`Authentication failure: ${req.method} ${req.url} - Status: ${res.statusCode}`, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
          });
        }
        
        return originalSend.call(this, body);
      };
      
      next();
    };
  };
}

export default SecurityMiddleware;