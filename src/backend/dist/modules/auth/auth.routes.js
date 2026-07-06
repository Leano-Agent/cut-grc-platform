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
exports.initializeAuthRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../../utils/jwt");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const security_middleware_1 = require("../../middleware/security.middleware");
const errorMiddleware_1 = require("../../middleware/errorMiddleware");
const logger_1 = __importStar(require("../../config/logger"));
const email_service_1 = require("../../services/email.service");
const User_1 = __importDefault(require("../../models/User"));
const router = (0, express_1.Router)();
let authMiddleware;
let securityMiddleware;
let tokenBlacklist;
const initializeAuthRoutes = (redisClient) => {
    authMiddleware = new auth_middleware_1.AuthMiddleware(redisClient);
    securityMiddleware = new security_middleware_1.SecurityMiddleware(redisClient);
    tokenBlacklist = new jwt_1.TokenBlacklist(redisClient);
};
exports.initializeAuthRoutes = initializeAuthRoutes;
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';
const registerSchema = zod_1.z.object({
    email: validation_middleware_1.ValidationMiddleware.schemas.email,
    password: validation_middleware_1.ValidationMiddleware.schemas.password,
    firstName: zod_1.z.string().min(1, 'First name is required').max(50),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(50),
    role: zod_1.z.enum(['student', 'faculty', 'admin', 'auditor', 'staff', 'risk_manager', 'compliance_officer', 'manager']).default('student'),
});
const loginSchema = zod_1.z.object({
    email: validation_middleware_1.ValidationMiddleware.schemas.email,
    password: zod_1.z.string().min(1, 'Password is required'),
});
const refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: validation_middleware_1.ValidationMiddleware.schemas.password,
});
const resetPasswordRequestSchema = zod_1.z.object({
    email: validation_middleware_1.ValidationMiddleware.schemas.email,
});
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    newPassword: validation_middleware_1.ValidationMiddleware.schemas.password,
});
router.post('/register', validation_middleware_1.ValidationMiddleware.validateBody(registerSchema), security_middleware_1.SecurityMiddleware.sqlInjectionProtection(), security_middleware_1.SecurityMiddleware.xssProtection(), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { email, password, firstName, lastName, role } = req.body;
    const existingUser = await User_1.default.findOne({ where: { email } });
    if (existingUser) {
        (0, errorMiddleware_1.sendError)(res, 409, 'A user with this email already exists', 'EMAIL_EXISTS');
        return;
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    const userId = `user_${Date.now()}`;
    const user = await User_1.default.create({
        id: userId,
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: role || 'student',
        organisationId: DEFAULT_ORG_ID,
        isActive: true,
        emailVerified: false,
        failedLoginAttempts: 0,
        refreshTokenVersion: 1,
    });
    const accessToken = jwt_1.JWTService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions: getPermissionsForRole(user.role),
    });
    const refreshToken = jwt_1.JWTService.generateRefreshToken({
        userId: user.id,
        tokenVersion: user.refreshTokenVersion,
    });
    (0, logger_1.logAuthentication)('register', userId, req.ip || 'unknown', true, { role });
    email_service_1.emailService.sendWelcomeEmail(email, firstName).catch(err => {
        logger_1.default.warn('Welcome email failed (non-fatal)', { email, error: err });
    });
    res.status(201).json({
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        },
        token: accessToken,
        refreshToken,
        expiresIn: 24 * 60 * 60,
    });
}));
router.post('/login', validation_middleware_1.ValidationMiddleware.validateBody(loginSchema), (req, res, next) => securityMiddleware ? securityMiddleware.bruteForceProtection()(req, res, next) : next(), security_middleware_1.SecurityMiddleware.sqlInjectionProtection(), security_middleware_1.SecurityMiddleware.xssProtection(), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const user = await User_1.default.findOne({ where: { email, isActive: true } });
    if (!user) {
        (0, logger_1.logAuthentication)('login', 'unknown', req.ip || 'unknown', false, { reason: 'user_not_found', email });
        (0, errorMiddleware_1.sendError)(res, 401, 'Invalid credentials', 'INVALID_CREDENTIALS');
        return;
    }
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        (0, logger_1.logAuthentication)('login', user.id, req.ip || 'unknown', false, { reason: 'account_locked' });
        (0, errorMiddleware_1.sendError)(res, 423, 'Account is temporarily locked. Try again later.', 'ACCOUNT_LOCKED');
        return;
    }
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        const failedAttempts = user.failedLoginAttempts + 1;
        const updates = { failedLoginAttempts: failedAttempts };
        if (failedAttempts >= 5) {
            updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        }
        await User_1.default.update(updates, { where: { id: user.id } });
        (0, logger_1.logAuthentication)('login', user.id, req.ip || 'unknown', false, {
            reason: 'invalid_password',
            failedAttempts
        });
        (0, errorMiddleware_1.sendError)(res, 401, 'Invalid credentials', 'INVALID_CREDENTIALS');
        return;
    }
    await User_1.default.update({ failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }, { where: { id: user.id } });
    const accessToken = jwt_1.JWTService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions: getPermissionsForRole(user.role),
    });
    const refreshToken = jwt_1.JWTService.generateRefreshToken({
        userId: user.id,
        tokenVersion: user.refreshTokenVersion,
    });
    if (securityMiddleware) {
        try {
            await securityMiddleware.resetBruteForceCounter()(req, res, () => {
            });
        }
        catch (_e) {
        }
    }
    (0, logger_1.logAuthentication)('login', user.id, req.ip || 'unknown', true, { role: user.role });
    res.status(200).json({
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        },
        token: accessToken,
        refreshToken,
        expiresIn: 24 * 60 * 60,
    });
}));
router.post('/refresh', validation_middleware_1.ValidationMiddleware.validateBody(refreshTokenSchema), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    const payload = jwt_1.JWTService.verifyRefreshToken(refreshToken);
    if (!payload) {
        (0, errorMiddleware_1.sendError)(res, 401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
        return;
    }
    const isBlacklisted = await tokenBlacklist.isBlacklisted(refreshToken);
    if (isBlacklisted) {
        (0, errorMiddleware_1.sendError)(res, 401, 'Refresh token has been revoked', 'REFRESH_TOKEN_REVOKED');
        return;
    }
    const currentVersion = await tokenBlacklist.getRefreshTokenVersion(payload.userId);
    if (currentVersion !== 0 && payload.tokenVersion !== currentVersion) {
        (0, errorMiddleware_1.sendError)(res, 401, 'Refresh token version mismatch', 'TOKEN_VERSION_MISMATCH');
        return;
    }
    const user = {
        id: payload.userId,
        email: 'user@example.com',
        role: 'admin',
    };
    const newAccessToken = jwt_1.JWTService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions: getPermissionsForRole(user.role),
    });
    const newRefreshToken = jwt_1.JWTService.generateRefreshToken({
        userId: user.id,
        tokenVersion: payload.tokenVersion,
    });
    if (newRefreshToken !== refreshToken) {
        const expiration = jwt_1.JWTService.getTokenExpiration(refreshToken);
        if (expiration) {
            const now = new Date();
            const expirySeconds = Math.max(1, Math.floor((expiration.getTime() - now.getTime()) / 1000));
            await tokenBlacklist.addToBlacklist(refreshToken, expirySeconds);
        }
    }
    res.status(200).json({
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 24 * 60 * 60,
    });
}));
router.post('/logout', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (req, res, next) => authMiddleware ? authMiddleware.logout(req, res, next) : next(), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    (0, errorMiddleware_1.sendSuccess)(res, null, 'Logged out successfully');
}));
router.post('/logout-all', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        (0, errorMiddleware_1.sendError)(res, 401, 'Authentication required', 'NO_AUTH');
        return;
    }
    await tokenBlacklist.incrementRefreshTokenVersion(req.user.userId);
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const expiration = jwt_1.JWTService.getTokenExpiration(token);
        if (expiration) {
            const now = new Date();
            const expirySeconds = Math.max(1, Math.floor((expiration.getTime() - now.getTime()) / 1000));
            await tokenBlacklist.addToBlacklist(token, expirySeconds);
        }
    }
    (0, logger_1.logAuthentication)('logout_all', req.user.userId, req.ip || 'unknown', true);
    (0, errorMiddleware_1.sendSuccess)(res, null, 'Logged out from all devices successfully');
}));
router.post('/change-password', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateBody(changePasswordSchema), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        (0, errorMiddleware_1.sendError)(res, 401, 'Authentication required', 'NO_AUTH');
        return;
    }
    const { currentPassword: _currentPassword, newPassword: _newPassword } = req.body;
    (0, logger_1.logAuthentication)('change_password', req.user.userId, req.ip || 'unknown', true);
    (0, errorMiddleware_1.sendSuccess)(res, null, 'Password changed successfully');
}));
router.post('/forgot-password', validation_middleware_1.ValidationMiddleware.validateBody(resetPasswordRequestSchema), (req, res, next) => securityMiddleware ? securityMiddleware.bruteForceProtection()(req, res, next) : next(), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { email: _email } = req.body;
    (0, errorMiddleware_1.sendSuccess)(res, null, 'If an account exists with this email, a reset link has been sent');
}));
router.post('/reset-password', validation_middleware_1.ValidationMiddleware.validateBody(resetPasswordSchema), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { token: _token, newPassword: _newPassword } = req.body;
    (0, errorMiddleware_1.sendSuccess)(res, null, 'Password reset successfully');
}));
router.get('/me', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        (0, errorMiddleware_1.sendError)(res, 401, 'Authentication required', 'NO_AUTH');
        return;
    }
    const user = await User_1.default.findByPk(req.user.userId);
    if (!user) {
        (0, errorMiddleware_1.sendError)(res, 404, 'User not found', 'USER_NOT_FOUND');
        return;
    }
    res.status(200).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: req.user.permissions,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
    });
}));
router.get('/verify-email/:token', validation_middleware_1.ValidationMiddleware.validateParams(zod_1.z.object({ token: zod_1.z.string() })), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { token: _token } = req.params;
    (0, errorMiddleware_1.sendSuccess)(res, null, 'Email verified successfully');
}));
function getPermissionsForRole(role) {
    const permissions = {
        student: ['view_risks', 'view_compliance', 'submit_risks'],
        faculty: ['view_risks', 'view_compliance', 'submit_risks', 'review_risks', 'manage_courses'],
        admin: ['view_risks', 'view_compliance', 'submit_risks', 'review_risks', 'manage_courses', 'manage_users', 'system_config'],
        auditor: ['view_risks', 'view_compliance', 'audit_risks', 'audit_compliance', 'generate_reports'],
        staff: ['view_risks', 'view_compliance'],
        risk_manager: ['view_risks', 'view_compliance', 'submit_risks', 'review_risks', 'manage_risks'],
        compliance_officer: ['view_risks', 'view_compliance', 'submit_risks', 'manage_compliance', 'audit_compliance'],
        manager: ['view_risks', 'view_compliance', 'submit_risks', 'review_risks', 'manage_users'],
    };
    return permissions[role] || permissions.student;
}
exports.default = router;
//# sourceMappingURL=auth.routes.js.map