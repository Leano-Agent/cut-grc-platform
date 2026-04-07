import { Request, Response } from 'express';
import database from '../config/database';
import redis from '../config/redis';
import logger from '../utils/logger';

/**
 * Health check controller for monitoring system health
 */
export class HealthController {
  /**
   * Basic health check endpoint
   */
  static async basicHealth(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    });
  }

  /**
   * Comprehensive health check with dependencies
   */
  static async comprehensiveHealth(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Check database health
      const dbHealth = await database.checkDatabaseHealth();
      
      // Check Redis health
      const redisHealth = await redis.healthCheck();
      
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      // Check disk space (simplified)
      const diskInfo = {
        free: 'N/A', // Would require fs.statfs in production
        total: 'N/A',
      };
      
      const response = {
        status: dbHealth.healthy && redisHealth.healthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: Date.now() - startTime,
        
        dependencies: {
          database: {
            healthy: dbHealth.healthy,
            message: dbHealth.message,
            latency: dbHealth.latency,
            connectionPool: await database.getDatabaseStats(),
          },
          redis: {
            healthy: redisHealth.healthy,
            message: redisHealth.message,
            latency: redisHealth.latency,
            connected: redis.isReady(),
          },
        },
        
        system: {
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
            percentage: Math.round(memoryPercent) + '%',
            rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
          },
          cpu: {
            usage: process.cpuUsage(),
            architecture: process.arch,
            platform: process.platform,
          },
          disk: diskInfo,
          node: {
            version: process.version,
            pid: process.pid,
            uptime: process.uptime(),
          },
        },
        
        application: {
          environment: process.env.NODE_ENV || 'development',
          version: process.env.npm_package_version || '1.0.0',
          name: process.env.npm_package_name || 'cut-grc-backend',
        },
      };
      
      // Determine HTTP status code
      const statusCode = response.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json(response);
      
      // Log health check
      logger.info('Health check completed', {
        status: response.status,
        responseTime: response.responseTime,
        dbHealthy: dbHealth.healthy,
        redisHealthy: redisHealth.healthy,
      });
      
    } catch (error) {
      logger.error('Health check failed', { error });
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
      });
    }
  }

  /**
   * Database-specific health check
   */
  static async databaseHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await database.checkDatabaseHealth();
      const stats = await database.getDatabaseStats();
      
      const response = {
        healthy: health.healthy,
        message: health.message,
        timestamp: new Date().toISOString(),
        latency: health.latency,
        connectionPool: stats,
        details: {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          ssl: process.env.DB_SSL === 'true',
        },
      };
      
      res.status(health.healthy ? 200 : 503).json(response);
      
    } catch (error) {
      logger.error('Database health check failed', { error });
      
      res.status(503).json({
        healthy: false,
        message: error instanceof Error ? error.message : 'Database check failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Redis-specific health check
   */
  static async redisHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await redis.healthCheck();
      
      const response = {
        healthy: health.healthy,
        message: health.message,
        timestamp: new Date().toISOString(),
        latency: health.latency,
        connected: redis.isReady(),
        details: {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
          keyPrefix: process.env.REDIS_KEY_PREFIX || 'cut-grc:',
        },
      };
      
      res.status(health.healthy ? 200 : 503).json(response);
      
    } catch (error) {
      logger.error('Redis health check failed', { error });
      
      res.status(503).json({
        healthy: false,
        message: error instanceof Error ? error.message : 'Redis check failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Readiness probe for Kubernetes/container orchestration
   */
  static async readiness(req: Request, res: Response): Promise<void> {
    try {
      const [dbHealth, redisHealth] = await Promise.all([
        database.checkDatabaseHealth(),
        redis.healthCheck(),
      ]);
      
      const isReady = dbHealth.healthy && redisHealth.healthy;
      
      const response = {
        ready: isReady,
        timestamp: new Date().toISOString(),
        checks: {
          database: dbHealth.healthy,
          redis: redisHealth.healthy,
        },
        details: {
          database: dbHealth.message,
          redis: redisHealth.message,
        },
      };
      
      res.status(isReady ? 200 : 503).json(response);
      
    } catch (error) {
      logger.error('Readiness check failed', { error });
      
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Readiness check failed',
      });
    }
  }

  /**
   * Liveness probe for Kubernetes/container orchestration
   */
  static async liveness(req: Request, res: Response): Promise<void> {
    // Liveness check is simpler - just check if the process is running
    const memoryUsage = process.memoryUsage();
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    // Consider process unhealthy if memory usage is too high
    const isAlive = memoryPercent < 90; // 90% memory usage threshold
    
    const response = {
      alive: isAlive,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        percentage: Math.round(memoryPercent) + '%',
      },
    };
    
    res.status(isAlive ? 200 : 503).json(response);
    
    if (!isAlive) {
      logger.error('Liveness check failed - high memory usage', {
        memoryPercent,
        memoryUsage,
      });
    }
  }

  /**
   * Metrics endpoint for monitoring systems
   */
  static async metrics(req: Request, res: Response): Promise<void> {
    try {
      const [dbStats, redisStats, memoryUsage] = await Promise.all([
        database.getDatabaseStats(),
        redis.getStats().catch(() => ({})), // Don't fail metrics if Redis is down
        process.memoryUsage(),
      ]);
      
      const metrics = {
        timestamp: new Date().toISOString(),
        
        database: {
          connectionPool: dbStats,
          queries: {
            // Would be populated from pg_stat_statements in production
            total: 0,
            slow: 0,
          },
        },
        
        redis: {
          connected: redis.isReady(),
          stats: redisStats,
        },
        
        system: {
          memory: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
            external: memoryUsage.external,
          },
          cpu: process.cpuUsage(),
          uptime: process.uptime(),
        },
        
        application: {
          requests: {
            // Would be populated from request counters
            total: 0,
            successful: 0,
            failed: 0,
          },
          responseTimes: {
            p50: 0,
            p95: 0,
            p99: 0,
          },
        },
      };
      
      res.status(200).json(metrics);
      
    } catch (error) {
      logger.error('Metrics collection failed', { error });
      
      res.status(500).json({
        error: 'Failed to collect metrics',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Version information endpoint
   */
  static async version(req: Request, res: Response): Promise<void> {
    const packageJson = require('../../package.json');
    
    res.status(200).json({
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }
}