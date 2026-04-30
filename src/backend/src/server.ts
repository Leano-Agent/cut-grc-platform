import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';

// Load environment variables
dotenv.config();

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
import AuthMiddleware from './middleware/auth.middleware';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import riskRoutes from './modules/risks/risk.routes';
import documentRoutes from './modules/documents/document.routes';
import workflowRoutes from './modules/workflows/workflow.routes';

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
      logger.error('Database connection failed:', error);
      process.exit(1);
    }
  }

  private initializeRedis(): void {
    this.redisPubClient = new Redis(config.redis);
    this.redisSubClient = this.redisPubClient.duplicate();
    
    this.redisPubClient.on('connect', () => {
      logger.info('Redis Pub client connected');
    });
    
    this.redisPubClient.on('error', (error) => {
      logger.error('Redis Pub client error:', error);
    });
    
    this.redisSubClient.on('connect', () => {
      logger.info('Redis Sub client connected');
    });
    
    this.redisSubClient.on('error', (error) => {
      logger.error('Redis Sub client error:', error);
    });
  }

  private initializeSocketIO(): void {
    this.io = new Server(this.httpServer, {
      cors: {
        origin: config.corsOrigin,
        credentials: true,
      },
      adapter: createAdapter(this.redisPubClient, this.redisSubClient),
    });
    
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
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: database.isConnectedStatus() ? 'connected' : 'disconnected',
        redis: this.redisPubClient.status === 'ready' ? 'connected' : 'disconnected',
      });
    });
    
    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/users', userRoutes);
    this.app.use('/api/v1/risks', riskRoutes);
    this.app.use('/api/v1/documents', documentRoutes);
    this.app.use('/api/v1/workflows', workflowRoutes);
    
    // API documentation
    if (process.env.NODE_ENV !== 'production') {
      this.app.use('/api-docs', require('swagger-ui-express').serve);
      this.app.get('/api-docs', require('swagger-ui-express').setup(require('../docs/openapi.json')));
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
const app = new App();
app.listen();

export default app;