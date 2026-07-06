"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
const logger_1 = __importDefault(require("../config/logger"));
class AuthMiddleware {
    tokenBlacklist;
    constructor(redisClient) {
        this.tokenBlacklist = new jwt_1.TokenBlacklist(redisClient);
    }
    verifyToken = async (req, res, next) => {
        try {
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
            const isBlacklisted = await this.tokenBlacklist.isBlacklisted(token);
            if (isBlacklisted) {
                res.status(401).json({
                    success: false,
                    error: 'Token has been revoked. Please login again.',
                    code: 'TOKEN_REVOKED'
                });
                return;
            }
            const payload = jwt_1.JWTService.verifyAccessToken(token);
            if (!payload) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid or expired token. Please login again.',
                    code: 'INVALID_TOKEN'
                });
                return;
            }
            if (jwt_1.JWTService.isTokenExpired(token)) {
                res.status(401).json({
                    success: false,
                    error: 'Token has expired. Please login again.',
                    code: 'TOKEN_EXPIRED'
                });
                return;
            }
            req.user = {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                permissions: payload.permissions
            };
            next();
        }
        catch (error) {
            logger_1.default.error('Token verification error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error during authentication.',
                code: 'AUTH_ERROR'
            });
        }
    };
    requireRole = (requiredRole) => {
        return (req, res, next) => {
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
    requireAnyRole = (allowedRoles) => {
        return (req, res, next) => {
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
    requirePermission = (requiredPermission) => {
        return (req, res, next) => {
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
    requireAnyPermission = (allowedPermissions) => {
        return (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required.',
                    code: 'NO_AUTH'
                });
                return;
            }
            const hasPermission = req.user.permissions.some(permission => allowedPermissions.includes(permission));
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
    optionalAuth = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const isBlacklisted = await this.tokenBlacklist.isBlacklisted(token);
                if (!isBlacklisted) {
                    const payload = jwt_1.JWTService.verifyAccessToken(token);
                    if (payload && !jwt_1.JWTService.isTokenExpired(token)) {
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
        }
        catch (error) {
            logger_1.default.debug('Optional auth error (non-critical):', error);
            next();
        }
    };
    logout = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const expiration = jwt_1.JWTService.getTokenExpiration(token);
                if (expiration) {
                    const now = new Date();
                    const expirySeconds = Math.max(1, Math.floor((expiration.getTime() - now.getTime()) / 1000));
                    await this.tokenBlacklist.addToBlacklist(token, expirySeconds);
                    logger_1.default.info(`Token blacklisted for user: ${req.user?.userId}`);
                }
            }
            next();
        }
        catch (error) {
            logger_1.default.error('Logout middleware error:', error);
            next();
        }
    };
}
exports.AuthMiddleware = AuthMiddleware;
exports.default = AuthMiddleware;
//# sourceMappingURL=auth.middleware.js.map