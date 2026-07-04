// === CRASH DIAGNOSTIC ===
// This MUST be the very first output. If you see migrations but NOT this,
// the crash happens during Node.js module loading (import/require phase).
console.log('[server] process started, loading modules...');

import express, { Application, Request, Response, NextFunction } from 'express';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';

// Load environment variables
dotenv.config();
console.log('[server] modules loaded, env configured');

// Import configurations
import config from './config/config';
import logger from './config/logger';
import database from './config/database';

// Import JWT utilities
import { JWTService, TokenBlacklist } from './utils/jwt';

// Import middleware
import { errorHandler, notFound } from './middleware/errorMiddleware';
import { SecurityMiddleware } from './middleware/security.middleware';
import { ValidationMiddleware } from './middleware/validation.middleware';

// Import routes
import authRoutes, { initializeAuthRoutes } from './modules/auth/auth.routes';
import userRoutes, { initializeUserRoutes } from './modules/users/user.routes';
import riskRoutes, { initializeRiskRoutes } from './modules/risks/risk.routes';
import documentRoutes, { initializeDocumentRoutes } from './modules/documents/document.routes';
import workflowRoutes, { initializeWorkflowRoutes } from './modules/workflows/workflow.routes';
import executiveRoutes, { initializeExecutiveRoutes } from './modules/executive/executive.routes';
import dashboardRoutes, { initializeDashboardRoutes } from './modules/dashboard/dashboard.routes';
import auditRoutes, { initializeAuditRoutes } from './modules/audits/audit.routes';
import complianceRoutes, { initializeComplianceRoutes } from './modules/compliance/compliance.routes';
import controlRoutes, { initializeControlRoutes } from './modules/controls/control.routes';
import ExecutiveAutomationService from './services/executive-automation.service';

class App {
  public app: Application;
  public port: number;
  private httpServer: ReturnType<typeof createServer>;
  private io: Server;
  private redisPubClient: Redis;
  private redisSubClient: Redis;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.httpServer = createServer(this.app);
    
    this.initializeMiddlewares();
    this.initializeDatabase();
    this.initializeRedis();
    this.initializeSocketIO();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Enhanced security headers with Helmet
    this.app.use(SecurityMiddleware.helmetConfig());
    
    // CORS configuration with security enhancements
    this.app.use(SecurityMiddleware.corsConfig());
    
    // Request size limiting
    this.app.use(SecurityMiddleware.requestSizeLimit());
    
    // SQL injection protection
    this.app.use(SecurityMiddleware.sqlInjectionProtection());
    
    // XSS protection
    this.app.use(SecurityMiddleware.xssProtection());
    
    // Body parsing with limits
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Input sanitization
    this.app.use(ValidationMiddleware.sanitizeInput);
    
    // Compression
    this.app.use(compression());
    
    // Enhanced rate limiting
    this.app.use('/api/', SecurityMiddleware.rateLimiter());
    this.app.use('/api/', SecurityMiddleware.speedLimiter());
    
    // Security logging
    this.app.use(SecurityMiddleware.securityLogging());
    
    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.userId,
      });
      next();
    });
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await database.connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Database connection failed, server will retry:', error);
      // Don't crash — let the server stay up and retry on next request
      // Railway healthcheck will pass; DB operations will return 503 until DB is ready
    }
  }

  private initializeRedis(): void {
    if (!config.redis?.host || config.redis.host === 'localhost') {
      logger.warn('Redis not configured — running without Redis cache. Socket.IO will use in-memory adapter.');
      return;
    }
    try {
      this.redisPubClient = new Redis(config.redis);
      this.redisSubClient = this.redisPubClient.duplicate();
      
      this.redisPubClient.on('connect', () => {
        logger.info('Redis Pub client connected');
      });
      
      this.redisPubClient.on('error', (error) => {
        logger.warn('Redis Pub client error (non-fatal):', error.message);
      });
      
      this.redisSubClient.on('connect', () => {
        logger.info('Redis Sub client connected');
      });
      
      this.redisSubClient.on('error', (error) => {
        logger.warn('Redis Sub client error (non-fatal):', error.message);
      });
    } catch (error) {
      logger.warn('Redis initialization failed — running without Redis cache:', (error as Error).message);
    }
  }

  private initializeSocketIO(): void {
    this.io = new Server(this.httpServer, {
      cors: {
        origin: config.corsOrigin,
        credentials: true,
      },
    });
    // Only use Redis adapter if Redis is available
    if (this.redisPubClient && this.redisSubClient) {
      try {
        this.io.adapter(createAdapter(this.redisPubClient, this.redisSubClient));
      } catch (error) {
        logger.warn('Redis adapter not available — using in-memory Socket.IO adapter');
      }
    }
    
    // Socket.IO middleware for authentication
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }
        
        // Verify JWT token
        const payload = JWTService.verifyAccessToken(token);
        if (!payload) {
          return next(new Error('Invalid or expired token'));
        }
        
        // Check if token is blacklisted
        const tokenBlacklist = new TokenBlacklist(this.redisPubClient);
        const isBlacklisted = await tokenBlacklist.isBlacklisted(token);
        if (isBlacklisted) {
          return next(new Error('Token has been revoked'));
        }
        
        // Attach user to socket
        socket.data.user = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          permissions: payload.permissions
        };
        
        next();
      } catch (error) {
        logger.error('Socket.IO authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
    
    this.io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);
      
      // Join user to their room
      const userId = socket.handshake.auth.userId;
      if (userId) {
        socket.join(`user:${userId}`);
      }
      
      // Join risk rooms based on permissions
      socket.on('join:risk', (riskId: string) => {
        socket.join(`risk:${riskId}`);
      });
      
      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
      });
    });
    
    // Make io available in routes
    this.app.set('io', this.io);
  }

  private initializeRoutes(): void {
    // CRITICAL: Initialize route middleware BEFORE route definitions
    // Sets authMiddleware, securityMiddleware, tokenBlacklist in each route module
    // Without this, every route is unprotected (lazy guards bypass via next())
    const redisClient = this.redisPubClient || null;
    logger.info('Initializing route middleware (auth, security)', { redisAvailable: !!redisClient });
    initializeAuthRoutes(redisClient as any);
    initializeUserRoutes(redisClient as any);
    initializeRiskRoutes(redisClient as any);
    initializeDocumentRoutes(redisClient as any);
    initializeWorkflowRoutes(redisClient as any);
    initializeExecutiveRoutes(redisClient as any);
    initializeDashboardRoutes(redisClient as any);
    initializeAuditRoutes(redisClient as any);
    initializeComplianceRoutes(redisClient as any);
    initializeControlRoutes(redisClient as any);
    logger.info('Route middleware initialized — auth enforcement is ACTIVE');

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: database.isConnectedStatus ? database.isConnectedStatus() : 'disconnected',
        redis: this.redisPubClient?.status === 'ready' ? 'connected' : 'disconnected',
      });
    });
    
    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/users', userRoutes);
    this.app.use('/api/v1/risks', riskRoutes);
    this.app.use('/api/v1/documents', documentRoutes);
    this.app.use('/api/v1/workflows', workflowRoutes);
    this.app.use('/api/v1/executive', executiveRoutes);
    this.app.use('/api/v1/dashboard', dashboardRoutes);
    this.app.use('/api/v1/audits', auditRoutes);
    this.app.use('/api/v1/compliance', complianceRoutes);
    this.app.use('/api/v1/controls', controlRoutes);
    
    // Initialize executive automation on startup
    try {
      const execService = ExecutiveAutomationService.getInstance();
      execService.startCronScheduler();
      logger.info('Executive automation service initialized');
    } catch (error) {
      logger.error('Failed to initialize executive automation', { error });
    }
    
    // API documentation
    if (process.env.NODE_ENV !== 'production') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const swaggerUi = require('swagger-ui-express');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const swaggerDoc = require('../docs/openapi.json');
        this.app.use('/api-docs', swaggerUi.serve);
        this.app.get('/api-docs', swaggerUi.setup(swaggerDoc));
      } catch (error: any) {
        logger.warn('Swagger UI not available', { reason: error.message });
      }
    }
    
    // Catch-all route for undefined endpoints
    this.app.all('*', notFound);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public listen(): void {
    this.httpServer.listen(this.port, () => {
      logger.info(`Server running on port ${this.port} in ${process.env.NODE_ENV} mode`);
      logger.info(`API Documentation available at http://localhost:${this.port}/api-docs`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.shutdown();
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.shutdown();
    });
  }

  private async shutdown(): Promise<void> {
    logger.info('Starting graceful shutdown...');
    
    try {
      // Close HTTP server
      this.httpServer.close(() => {
        logger.info('HTTP server closed');
      });
      
      // Close database connection
      await database.disconnect();
      logger.info('Database connection closed');
      
      // Close Redis connections
      await this.redisPubClient.quit();
      await this.redisSubClient.quit();
      logger.info('Redis connections closed');
      
      // Close Socket.IO
      this.io.close();
      logger.info('Socket.IO server closed');
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Create and start the application
console.log('[server] constructing App...');

let app: App | undefined;
try {
  app = new App();
  console.log('[server] App constructed, calling listen()...');
  app.listen();
  console.log('[server] listen() called');
} catch (error: any) {
  console.error('[server] FATAL: App construction failed:', error?.message || error);
  console.error(error?.stack);
  process.exit(1);
}

export default app;