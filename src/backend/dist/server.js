"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const ioredis_1 = __importDefault(require("ioredis"));
const redis_adapter_1 = require("@socket.io/redis-adapter");
dotenv_1.default.config();
const config_1 = __importDefault(require("./config/config"));
const logger_1 = __importDefault(require("./config/logger"));
const database_1 = __importDefault(require("./config/database"));
const jwt_1 = require("./utils/jwt");
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const security_middleware_1 = require("./middleware/security.middleware");
const validation_middleware_1 = require("./middleware/validation.middleware");
const auth_routes_1 = __importStar(require("./modules/auth/auth.routes"));
const user_routes_1 = __importStar(require("./modules/users/user.routes"));
const risk_routes_1 = __importStar(require("./modules/risks/risk.routes"));
const document_routes_1 = __importStar(require("./modules/documents/document.routes"));
const workflow_routes_1 = __importStar(require("./modules/workflows/workflow.routes"));
const executive_routes_1 = __importStar(require("./modules/executive/executive.routes"));
const dashboard_routes_1 = __importStar(require("./modules/dashboard/dashboard.routes"));
const audit_routes_1 = __importStar(require("./modules/audits/audit.routes"));
const compliance_routes_1 = __importStar(require("./modules/compliance/compliance.routes"));
const control_routes_1 = __importStar(require("./modules/controls/control.routes"));
const policy_routes_1 = __importStar(require("./modules/policies/policy.routes"));
const incident_routes_1 = __importStar(require("./modules/incidents/incident.routes"));
const survey_routes_1 = __importStar(require("./modules/surveys/survey.routes"));
const board_routes_1 = __importStar(require("./modules/boards/board.routes"));
const action_routes_1 = __importStar(require("./modules/actions/action.routes"));
const training_routes_1 = __importStar(require("./modules/training/training.routes"));
const bcp_routes_1 = __importStar(require("./modules/bcp/bcp.routes"));
const vendor_routes_1 = __importStar(require("./modules/vendors/vendor.routes"));
const executive_automation_service_1 = __importDefault(require("./services/executive-automation.service"));
class App {
    app;
    port;
    httpServer;
    io;
    redisPubClient;
    redisSubClient;
    constructor() {
        this.app = (0, express_1.default)();
        this.port = config_1.default.port;
        this.httpServer = (0, http_1.createServer)(this.app);
        this.initializeMiddlewares();
        this.initializeDatabase();
        this.initializeRedis();
        this.initializeSocketIO();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    initializeMiddlewares() {
        this.app.use(security_middleware_1.SecurityMiddleware.helmetConfig());
        this.app.use(security_middleware_1.SecurityMiddleware.corsConfig());
        this.app.use(security_middleware_1.SecurityMiddleware.requestSizeLimit());
        this.app.use(security_middleware_1.SecurityMiddleware.sqlInjectionProtection());
        this.app.use(security_middleware_1.SecurityMiddleware.xssProtection());
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use(validation_middleware_1.ValidationMiddleware.sanitizeInput);
        this.app.use((0, compression_1.default)());
        this.app.use('/api/', security_middleware_1.SecurityMiddleware.rateLimiter());
        this.app.use('/api/', security_middleware_1.SecurityMiddleware.speedLimiter());
        this.app.use(security_middleware_1.SecurityMiddleware.securityLogging());
        this.app.use((req, res, next) => {
            logger_1.default.info(`${req.method} ${req.url}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                userId: req.user?.userId,
            });
            next();
        });
    }
    async initializeDatabase() {
        try {
            await database_1.default.connect();
            logger_1.default.info('Database connected successfully');
        }
        catch (error) {
            logger_1.default.error('Database connection failed, server will retry:', error);
        }
    }
    initializeRedis() {
        if (!config_1.default.redis?.host || config_1.default.redis.host === 'localhost') {
            logger_1.default.warn('Redis not configured — running without Redis cache. Socket.IO will use in-memory adapter.');
            return;
        }
        try {
            this.redisPubClient = new ioredis_1.default(config_1.default.redis);
            this.redisSubClient = this.redisPubClient.duplicate();
            this.redisPubClient.on('connect', () => {
                logger_1.default.info('Redis Pub client connected');
            });
            this.redisPubClient.on('error', (error) => {
                logger_1.default.warn('Redis Pub client error (non-fatal):', error.message);
            });
            this.redisSubClient.on('connect', () => {
                logger_1.default.info('Redis Sub client connected');
            });
            this.redisSubClient.on('error', (error) => {
                logger_1.default.warn('Redis Sub client error (non-fatal):', error.message);
            });
        }
        catch (error) {
            logger_1.default.warn('Redis initialization failed — running without Redis cache:', error.message);
        }
    }
    initializeSocketIO() {
        this.io = new socket_io_1.Server(this.httpServer, {
            cors: {
                origin: config_1.default.corsOrigin,
                credentials: true,
            },
        });
        if (this.redisPubClient && this.redisSubClient) {
            try {
                this.io.adapter((0, redis_adapter_1.createAdapter)(this.redisPubClient, this.redisSubClient));
            }
            catch (error) {
                logger_1.default.warn('Redis adapter not available — using in-memory Socket.IO adapter');
            }
        }
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication token required'));
                }
                const payload = jwt_1.JWTService.verifyAccessToken(token);
                if (!payload) {
                    return next(new Error('Invalid or expired token'));
                }
                const tokenBlacklist = new jwt_1.TokenBlacklist(this.redisPubClient);
                const isBlacklisted = await tokenBlacklist.isBlacklisted(token);
                if (isBlacklisted) {
                    return next(new Error('Token has been revoked'));
                }
                socket.data.user = {
                    userId: payload.userId,
                    email: payload.email,
                    role: payload.role,
                    permissions: payload.permissions
                };
                next();
            }
            catch (error) {
                logger_1.default.error('Socket.IO authentication error:', error);
                next(new Error('Authentication failed'));
            }
        });
        this.io.on('connection', (socket) => {
            logger_1.default.info(`Socket connected: ${socket.id}`);
            const userId = socket.handshake.auth.userId;
            if (userId) {
                socket.join(`user:${userId}`);
            }
            socket.on('join:risk', (riskId) => {
                socket.join(`risk:${riskId}`);
            });
            socket.on('disconnect', () => {
                logger_1.default.info(`Socket disconnected: ${socket.id}`);
            });
        });
        this.app.set('io', this.io);
    }
    initializeRoutes() {
        const redisClient = this.redisPubClient || null;
        logger_1.default.info('Initializing route middleware (auth, security)', { redisAvailable: !!redisClient });
        (0, auth_routes_1.initializeAuthRoutes)(redisClient);
        (0, user_routes_1.initializeUserRoutes)(redisClient);
        (0, risk_routes_1.initializeRiskRoutes)(redisClient);
        (0, document_routes_1.initializeDocumentRoutes)(redisClient);
        (0, workflow_routes_1.initializeWorkflowRoutes)(redisClient);
        (0, executive_routes_1.initializeExecutiveRoutes)(redisClient);
        (0, dashboard_routes_1.initializeDashboardRoutes)(redisClient);
        (0, audit_routes_1.initializeAuditRoutes)(redisClient);
        (0, compliance_routes_1.initializeComplianceRoutes)(redisClient);
        (0, control_routes_1.initializeControlRoutes)(redisClient);
        (0, policy_routes_1.initializePolicyRoutes)(redisClient);
        (0, incident_routes_1.initializeIncidentRoutes)(redisClient);
        (0, survey_routes_1.initializeSurveyRoutes)(redisClient);
        (0, board_routes_1.initializeBoardRoutes)(redisClient);
        (0, action_routes_1.initializeActionRoutes)(redisClient);
        (0, training_routes_1.initializeTrainingRoutes)(redisClient);
        (0, bcp_routes_1.initializeBcpRoutes)(redisClient);
        (0, vendor_routes_1.initializeVendorRoutes)(redisClient);
        logger_1.default.info('Route middleware initialized — auth enforcement is ACTIVE');
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: database_1.default.isConnectedStatus ? database_1.default.isConnectedStatus() : 'disconnected',
                redis: this.redisPubClient?.status === 'ready' ? 'connected' : 'disconnected',
            });
        });
        this.app.use('/api/v1/auth', auth_routes_1.default);
        this.app.use('/api/v1/users', user_routes_1.default);
        this.app.use('/api/v1/risks', risk_routes_1.default);
        this.app.use('/api/v1/documents', document_routes_1.default);
        this.app.use('/api/v1/workflows', workflow_routes_1.default);
        this.app.use('/api/v1/executive', executive_routes_1.default);
        this.app.use('/api/v1/dashboard', dashboard_routes_1.default);
        this.app.use('/api/v1/audits', audit_routes_1.default);
        this.app.use('/api/v1/compliance', compliance_routes_1.default);
        this.app.use('/api/v1/controls', control_routes_1.default);
        this.app.use('/api/v1/policies', policy_routes_1.default);
        this.app.use('/api/v1/incidents', incident_routes_1.default);
        this.app.use('/api/v1/surveys', survey_routes_1.default);
        this.app.use('/api/v1/boards', board_routes_1.default);
        this.app.use('/api/v1/actions', action_routes_1.default);
        this.app.use('/api/v1/training', training_routes_1.default);
        this.app.use('/api/v1/bcp', bcp_routes_1.default);
        this.app.use('/api/v1/vendors', vendor_routes_1.default);
        try {
            const execService = executive_automation_service_1.default.getInstance();
            execService.startCronScheduler();
            logger_1.default.info('Executive automation service initialized');
        }
        catch (error) {
            logger_1.default.error('Failed to initialize executive automation', { error });
        }
        if (process.env.NODE_ENV !== 'production') {
            try {
                const swaggerUi = require('swagger-ui-express');
                const swaggerDoc = require('../docs/openapi.json');
                this.app.use('/api-docs', swaggerUi.serve);
                this.app.get('/api-docs', swaggerUi.setup(swaggerDoc));
            }
            catch (error) {
                logger_1.default.warn('Swagger UI not available', { reason: error.message });
            }
        }
        this.app.all('*', errorMiddleware_1.notFound);
    }
    initializeErrorHandling() {
        this.app.use(errorMiddleware_1.errorHandler);
    }
    listen() {
        this.httpServer.listen(this.port, () => {
            logger_1.default.info(`Server running on port ${this.port} in ${process.env.NODE_ENV} mode`);
            logger_1.default.info(`API Documentation available at http://localhost:${this.port}/api-docs`);
        });
        process.on('SIGTERM', () => {
            logger_1.default.info('SIGTERM received, shutting down gracefully');
            this.shutdown();
        });
        process.on('SIGINT', () => {
            logger_1.default.info('SIGINT received, shutting down gracefully');
            this.shutdown();
        });
    }
    async shutdown() {
        logger_1.default.info('Starting graceful shutdown...');
        try {
            this.httpServer.close(() => {
                logger_1.default.info('HTTP server closed');
            });
            await database_1.default.disconnect();
            logger_1.default.info('Database connection closed');
            await this.redisPubClient.quit();
            await this.redisSubClient.quit();
            logger_1.default.info('Redis connections closed');
            this.io.close();
            logger_1.default.info('Socket.IO server closed');
            logger_1.default.info('Graceful shutdown completed');
            process.exit(0);
        }
        catch (error) {
            logger_1.default.error('Error during shutdown:', error);
            process.exit(1);
        }
    }
}
const app = new App();
app.listen();
exports.default = app;
//# sourceMappingURL=server.js.map