"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityMiddleware = void 0;
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
const logger_1 = __importDefault(require("../config/logger"));
const config_1 = __importDefault(require("../config/config"));
class SecurityMiddleware {
    redis;
    constructor(redisClient) {
        this.redis = redisClient;
    }
    static helmetConfig = () => {
        return (0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "https://api.cut.ac.za", "https://cut-grc-backend-production.up.railway.app"],
                    frameSrc: ["'none'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    formAction: ["'self'"],
                    frameAncestors: ["'none'"],
                    upgradeInsecureRequests: [],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
            hidePoweredBy: true,
            noSniff: true,
            xssFilter: true,
            frameguard: {
                action: 'deny',
            },
            referrerPolicy: {
                policy: 'strict-origin-when-cross-origin',
            },
            crossOriginEmbedderPolicy: false,
            crossOriginOpenerPolicy: { policy: 'same-origin' },
            crossOriginResourcePolicy: { policy: 'same-site' },
        });
    };
    static rateLimiter = () => {
        return (0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: {
                success: false,
                error: 'Too many requests from this IP, please try again later.',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: 900,
            },
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
            keyGenerator: (req) => {
                return req.ip || req.socket.remoteAddress || 'unknown';
            },
            handler: (req, res) => {
                logger_1.default.warn(`Rate limit exceeded for IP: ${req.ip}`);
                res.status(429).json({
                    success: false,
                    error: 'Too many requests from this IP, please try again later.',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: 900,
                });
            },
        });
    };
    static speedLimiter = () => {
        return (0, express_slow_down_1.default)({
            windowMs: 15 * 60 * 1000,
            delayAfter: 50,
            delayMs: 100,
            maxDelayMs: 5000,
            skipSuccessfulRequests: false,
            keyGenerator: (req) => {
                return req.ip || req.socket.remoteAddress || 'unknown';
            },
            onLimitReached: (req) => {
                logger_1.default.warn(`Speed limit reached for IP: ${req.ip}`);
            },
        });
    };
    bruteForceProtection = () => {
        return async (req, res, next) => {
            if (this.redis.status !== 'ready') {
                logger_1.default.warn('Redis not ready — skipping brute force protection');
                next();
                return;
            }
            try {
                const ip = req.ip || req.socket.remoteAddress || 'unknown';
                const key = `bruteforce:${ip}:${req.path}`;
                const attempts = await this.redis.get(key);
                const attemptCount = attempts ? parseInt(attempts, 10) : 0;
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
                await this.redis.setex(key, 900, attemptCount + 1);
                if (attemptCount >= 10) {
                    await this.redis.setex(blockedKey, 3600, '1');
                    logger_1.default.warn(`IP blocked for brute force: ${ip}`);
                    res.status(429).json({
                        success: false,
                        error: 'IP temporarily blocked due to too many failed attempts. Try again in 1 hour.',
                        code: 'IP_BLOCKED',
                        retryAfter: 3600,
                    });
                    return;
                }
                if (attemptCount > 5) {
                    const delay = Math.min(attemptCount * 100, 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                next();
            }
            catch (error) {
                logger_1.default.error('Brute force protection middleware error:', error);
                next();
            }
        };
    };
    resetBruteForceCounter = () => {
        return async (req, res, next) => {
            try {
                const ip = req.ip || req.socket.remoteAddress || 'unknown';
                const key = `bruteforce:${ip}:${req.path}`;
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    await this.redis.del(key);
                }
                next();
            }
            catch (error) {
                logger_1.default.error('Reset brute force counter middleware error:', error);
                next();
            }
        };
    };
    static corsConfig = () => {
        return (req, res, next) => {
            const allowedOrigins = config_1.default.corsOrigin.split(',').map(origin => origin.trim());
            const origin = req.headers.origin;
            if (origin && allowedOrigins.includes(origin)) {
                res.setHeader('Access-Control-Allow-Origin', origin);
            }
            else if (config_1.default.isDevelopment && origin) {
                console.warn(`⚠️ DEVELOPMENT MODE: Allowing CORS for origin: ${origin}`);
                res.setHeader('Access-Control-Allow-Origin', origin);
            }
            else if (origin) {
                console.warn(`🚨 BLOCKED CORS REQUEST from origin: ${origin}`);
            }
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Max-Age', '86400');
            if (req.method === 'OPTIONS') {
                res.status(200).end();
                return;
            }
            next();
        };
    };
    csrfProtection = () => {
        return async (req, res, next) => {
            try {
                if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
                    next();
                    return;
                }
                if (req.path.startsWith('/api/') && req.headers.authorization) {
                    next();
                    return;
                }
                const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
                if (!csrfToken) {
                    res.status(403).json({
                        success: false,
                        error: 'CSRF token missing',
                        code: 'CSRF_TOKEN_MISSING',
                    });
                    return;
                }
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
            }
            catch (error) {
                logger_1.default.error('CSRF protection middleware error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error during CSRF validation.',
                    code: 'CSRF_VALIDATION_ERROR',
                });
            }
        };
    };
    static requestSizeLimit = () => {
        return (req, res, next) => {
            const MAX_REQUEST_SIZE = 10 * 1024 * 1024;
            let requestSize = 0;
            req.on('data', (chunk) => {
                requestSize += chunk.length;
                if (requestSize > MAX_REQUEST_SIZE) {
                    res.status(413).json({
                        success: false,
                        error: 'Request entity too large',
                        code: 'REQUEST_TOO_LARGE',
                        maxSize: `${MAX_REQUEST_SIZE / 1024 / 1024}MB`,
                    });
                    req.destroy();
                }
            });
            next();
        };
    };
    static sqlInjectionProtection = () => {
        return (req, res, next) => {
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
            const checkForSQLInjection = (value) => {
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
            if (checkForSQLInjection(req.body) ||
                checkForSQLInjection(req.query) ||
                checkForSQLInjection(req.params)) {
                logger_1.default.warn(`Potential SQL injection attempt detected from IP: ${req.ip}`);
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
    static xssProtection = () => {
        return (req, res, next) => {
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
            const checkForXSS = (value) => {
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
            if (checkForXSS(req.body) ||
                checkForXSS(req.query) ||
                checkForXSS(req.params)) {
                logger_1.default.warn(`Potential XSS attempt detected from IP: ${req.ip}`);
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
    static securityLogging = () => {
        return (req, res, next) => {
            const originalSend = res.send;
            const startTime = Date.now();
            res.send = function (body) {
                const duration = Date.now() - startTime;
                if (res.statusCode >= 400) {
                    logger_1.default.warn(`Security event: ${req.method} ${req.url} - Status: ${res.statusCode} - Duration: ${duration}ms`, {
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        userId: req.user?.userId,
                        statusCode: res.statusCode,
                        duration,
                    });
                }
                if (req.path.includes('/auth') && res.statusCode >= 400) {
                    logger_1.default.warn(`Authentication failure: ${req.method} ${req.url} - Status: ${res.statusCode}`, {
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
exports.SecurityMiddleware = SecurityMiddleware;
exports.default = SecurityMiddleware;
//# sourceMappingURL=security.middleware.js.map