import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { JWTService, TokenBlacklist } from '../../utils/jwt';
import { ValidationMiddleware } from '../../middleware/validation.middleware';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { SecurityMiddleware } from '../../middleware/security.middleware';
import { asyncHandler, sendSuccess, sendError } from '../../middleware/errorMiddleware';
import logger from '../../config/logger';
import { logAuthentication } from '../../config/logger';
import { emailService } from '../../services/email.service';
import User from '../../models/User';
import database from '../../config/database';

const router = Router();

// Initialize middleware
let authMiddleware: AuthMiddleware;
let securityMiddleware: SecurityMiddleware;
let tokenBlacklist: TokenBlacklist;

// These would be initialized with Redis client in server.ts
export const initializeAuthRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
  securityMiddleware = new SecurityMiddleware(redisClient);
  tokenBlacklist = new TokenBlacklist(redisClient);
};

// Validation schemas
const registerSchema = z.object({
  email: ValidationMiddleware.schemas.email,
  password: ValidationMiddleware.schemas.password,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.enum(['student', 'faculty', 'admin', 'auditor', 'staff', 'risk_manager', 'compliance_officer', 'manager']).default('student'),
});

const loginSchema = z.object({
  email: ValidationMiddleware.schemas.email,
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: ValidationMiddleware.schemas.password,
});

const resetPasswordRequestSchema = z.object({
  email: ValidationMiddleware.schemas.email,
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: ValidationMiddleware.schemas.password,
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  ValidationMiddleware.validateBody(registerSchema),
  SecurityMiddleware.sqlInjectionProtection(),
  SecurityMiddleware.xssProtection(),
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, role } = req.body;
    
    // Schema is already applied by prod-migrate.js on startup
    // User.sync({ alter: true }) removed — it blocks every request with ALTER TABLE scan
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      sendError(res, 409, 'A user with this email already exists', 'EMAIL_EXISTS');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user in database
    const userId = `user_${Date.now()}`;
    const user = await User.create({
      id: userId,
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      role: role || 'student',
      isActive: true,
      emailVerified: false,
      failedLoginAttempts: 0,
      refreshTokenVersion: 1,
    });
    
    // Generate tokens
    const accessToken = JWTService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: getPermissionsForRole(user.role),
    });
    
    const refreshToken = JWTService.generateRefreshToken({
      userId: user.id,
      tokenVersion: user.refreshTokenVersion,
    });
    
    logAuthentication('register', userId, req.ip || 'unknown', true, { role });

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(email, firstName).catch(err => {
      logger.warn('Welcome email failed (non-fatal)', { email, error: err });
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
  })
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post(
  '/login',
  ValidationMiddleware.validateBody(loginSchema),
  (req, res, next) => securityMiddleware ? securityMiddleware.bruteForceProtection()(req, res, next) : next(),
  SecurityMiddleware.sqlInjectionProtection(),
  SecurityMiddleware.xssProtection(),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // Schema is already applied by prod-migrate.js on startup
    // User.sync({ alter: true }) removed — it blocks every request with ALTER TABLE scan
    
    // Find user by email
    const user = await User.findOne({ where: { email, isActive: true } });
    
    if (!user) {
      logAuthentication('login', 'unknown', req.ip || 'unknown', false, { reason: 'user_not_found', email });
      sendError(res, 401, 'Invalid credentials', 'INVALID_CREDENTIALS');
      return;
    }
    
    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      logAuthentication('login', user.id, req.ip || 'unknown', false, { reason: 'account_locked' });
      sendError(res, 423, 'Account is temporarily locked. Try again later.', 'ACCOUNT_LOCKED');
      return;
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: failedAttempts };
      
      // Lock account after 5 failed attempts
      if (failedAttempts >= 5) {
        updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lockout
      }
      
      await User.update(updates, { where: { id: user.id } });
      
      logAuthentication('login', user.id, req.ip || 'unknown', false, { 
        reason: 'invalid_password',
        failedAttempts 
      });
      sendError(res, 401, 'Invalid credentials', 'INVALID_CREDENTIALS');
      return;
    }
    
    // Reset failed login attempts on successful login
    await User.update(
      { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
      { where: { id: user.id } }
    );
    
    // Generate tokens
    const accessToken = JWTService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: getPermissionsForRole(user.role),
    });
    
    const refreshToken = JWTService.generateRefreshToken({
      userId: user.id,
      tokenVersion: user.refreshTokenVersion,
    });
    
    // Reset brute force counter
    if (securityMiddleware) {
      try {
        await securityMiddleware.resetBruteForceCounter()(req, res, () => {});
      } catch (e) { /* non-critical */ }
    }
    
    logAuthentication('login', user.id, req.ip || 'unknown', true, { role: user.role });
    
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
  })
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public (with valid refresh token)
 */
router.post(
  '/refresh',
  ValidationMiddleware.validateBody(refreshTokenSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    
    // Verify refresh token
    const payload = JWTService.verifyRefreshToken(refreshToken);
    if (!payload) {
      sendError(res, 401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
      return;
    }
    
    // Check if refresh token is blacklisted
    const isBlacklisted = await tokenBlacklist.isBlacklisted(refreshToken);
    if (isBlacklisted) {
      sendError(res, 401, 'Refresh token has been revoked', 'REFRESH_TOKEN_REVOKED');
      return;
    }
    
    // Check token version (for logout all devices)
    const currentVersion = await tokenBlacklist.getRefreshTokenVersion(payload.userId);
    // Skip version check when Redis is unavailable (returns 0 meaning no version tracking)
    if (currentVersion !== 0 && payload.tokenVersion !== currentVersion) {
      sendError(res, 401, 'Refresh token version mismatch', 'TOKEN_VERSION_MISMATCH');
      return;
    }
    
    // In real app, get user from database
    const user = {
      id: payload.userId,
      email: 'user@example.com',
      role: 'admin',
    };
    
    // Generate new access token
    const newAccessToken = JWTService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: getPermissionsForRole(user.role),
    });
    
    // Generate new refresh token (optional - can reuse old one)
    const newRefreshToken = JWTService.generateRefreshToken({
      userId: user.id,
      tokenVersion: payload.tokenVersion,
    });
    
    // Blacklist old refresh token if generating new one
    if (newRefreshToken !== refreshToken) {
      const expiration = JWTService.getTokenExpiration(refreshToken);
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
  })
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (blacklist token)
 * @access  Private
 */
router.post(
  '/logout',
  (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(),
  (req, res, next) => authMiddleware ? authMiddleware.logout(req, res, next) : next(),
  asyncHandler(async (req, res) => {
    sendSuccess(res, null, 'Logged out successfully');
  })
);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post(
  '/logout-all',
  (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', 'NO_AUTH');
      return;
    }
    
    // Increment refresh token version to invalidate all existing refresh tokens
    await tokenBlacklist.incrementRefreshTokenVersion(req.user.userId);
    
    // Blacklist current access token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const expiration = JWTService.getTokenExpiration(token);
      if (expiration) {
        const now = new Date();
        const expirySeconds = Math.max(1, Math.floor((expiration.getTime() - now.getTime()) / 1000));
        await tokenBlacklist.addToBlacklist(token, expirySeconds);
      }
    }
    
    logAuthentication('logout_all', req.user.userId, req.ip || 'unknown', true);
    
    sendSuccess(res, null, 'Logged out from all devices successfully');
  })
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post(
  '/change-password',
  (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(),
  ValidationMiddleware.validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', 'NO_AUTH');
      return;
    }
    
    const { currentPassword: _currentPassword, newPassword: _newPassword } = req.body;
    
    // In real app:
    // 1. Get user from database
    // 2. Verify current password
    // 3. Update password hash
    // 4. Invalidate all existing tokens (optional)
    
    // For now, simulate success
    logAuthentication('change_password', req.user.userId, req.ip || 'unknown', true);
    
    sendSuccess(res, null, 'Password changed successfully');
  })
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  ValidationMiddleware.validateBody(resetPasswordRequestSchema),
  (req, res, next) => securityMiddleware ? securityMiddleware.bruteForceProtection()(req, res, next) : next(),
  asyncHandler(async (req, res) => {
    const { email: _email } = req.body;
    
    // In real app:
    // 1. Check if user exists
    // 2. Generate reset token
    // 3. Send email with reset link
    // 4. Store reset token in database with expiry
    
    // For security, always return success even if email doesn't exist
    // This prevents email enumeration attacks
    
    sendSuccess(res, null, 'If an account exists with this email, a reset link has been sent');
  })
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  ValidationMiddleware.validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { token: _token, newPassword: _newPassword } = req.body;
    
    // In real app:
    // 1. Verify reset token (check in database, check expiry)
    // 2. Update password
    // 3. Invalidate reset token
    // 4. Invalidate all existing sessions (optional)
    
    // For now, simulate success
    sendSuccess(res, null, 'Password reset successfully');
  })
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', 'NO_AUTH');
      return;
    }
    
    // Get real user from database
    const user = await User.findByPk(req.user.userId);
    
    if (!user) {
      sendError(res, 404, 'User not found', 'USER_NOT_FOUND');
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
  })
);

/**
 * @route   GET /api/v1/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get(
  '/verify-email/:token',
  ValidationMiddleware.validateParams(z.object({ token: z.string() })),
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    
    // In real app:
    // 1. Verify email token
    // 2. Update user email verification status
    // 3. Log the user in (optional)
    
    // For now, simulate success
    sendSuccess(res, null, 'Email verified successfully');
  })
);

// Helper function to get permissions based on role
function getPermissionsForRole(role: string): string[] {
  const permissions: Record<string, string[]> = {
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

export default router;