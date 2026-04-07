import { Router } from 'express';
import { HealthController } from './health.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: System health monitoring endpoints
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 12345.67
 *                 environment:
 *                   type: string
 *                   example: development
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
router.get('/', HealthController.basicHealth);

/**
 * @swagger
 * /health/comprehensive:
 *   get:
 *     summary: Comprehensive health check with dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System and dependencies are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 responseTime:
 *                   type: number
 *                   example: 45
 *                 dependencies:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         healthy:
 *                           type: boolean
 *                         message:
 *                           type: string
 *                         latency:
 *                           type: number
 *                     redis:
 *                       type: object
 *                       properties:
 *                         healthy:
 *                           type: boolean
 *                         message:
 *                           type: string
 *                         latency:
 *                           type: number
 *       503:
 *         description: System or dependencies are unhealthy
 */
router.get('/comprehensive', HealthController.comprehensiveHealth);

/**
 * @swagger
 * /health/database:
 *   get:
 *     summary: Database health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database is healthy
 *       503:
 *         description: Database is unhealthy
 */
router.get('/database', HealthController.databaseHealth);

/**
 * @swagger
 * /health/redis:
 *   get:
 *     summary: Redis health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Redis is healthy
 *       503:
 *         description: Redis is unhealthy
 */
router.get('/redis', HealthController.redisHealth);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe for container orchestration
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is ready to receive traffic
 *       503:
 *         description: Application is not ready
 */
router.get('/ready', HealthController.readiness);

/**
 * @swagger
 * /health/alive:
 *   get:
 *     summary: Liveness probe for container orchestration
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is alive
 *       503:
 *         description: Application is not alive
 */
router.get('/alive', HealthController.liveness);

/**
 * @swagger
 * /health/metrics:
 *   get:
 *     summary: System metrics for monitoring
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: object
 *                 redis:
 *                   type: object
 *                 system:
 *                   type: object
 *                 application:
 *                   type: object
 */
router.get('/metrics', HealthController.metrics);

/**
 * @swagger
 * /health/version:
 *   get:
 *     summary: Application version information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Version information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 version:
 *                   type: string
 *                 description:
 *                   type: string
 *                 environment:
 *                   type: string
 *                 nodeVersion:
 *                   type: string
 *                 uptime:
 *                   type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/version', HealthController.version);

export default router;