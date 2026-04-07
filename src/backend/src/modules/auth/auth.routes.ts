import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { JWTService, TokenBlacklist } from '../../utils/jwt';
import { ValidationMiddleware } from '../../middleware/validation.middleware';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { SecurityMiddleware } from '../../middleware/security.middleware';
import { asyncHandler, sendSuccess, sendError } from '../../middleware/errorMiddleware';
import logger from '../../config/logger';
import { logAuthentication } from '../../config/logger';

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
  role: z.enum(['student', 'faculty', 'admin', 'auditor']).default('student'),
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
    // In a real application, you would:
    // 1. Check if user already exists
    // 2. Hash password
    // 3. Create user in database
    // 4. Send verification email
    
    const { email, password, firstName, lastName, role } = req.body;
    
    // Simulate user creation
    const userId = `user_${Date.now()}`;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate tokens
    const accessToken = JWTService.generateAccessToken({
      userId,
      email,
      role,
      permissions: getPermissionsForRole(role),
    });
    
    const refreshToken = JWTService.generateRefreshToken({
      userId,
      tokenVersion: 1,
    });
    
    // Log the registration
    logAuthentication('register', userId, req.ip || 'unknown', true, { role });
    
    sendSuccess(res, {
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        role,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      },
    }, 'Registration successful', 201);
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
  securityMiddleware.bruteForceProtection(),
  SecurityMiddleware.sqlInjectionProtection(),
  SecurityMiddleware.xssProtection(),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // In a real application, you would:
    // 1. Find user by email
    // 2. Check if user exists and is active
    // 3. Verify password
    // 4. Check if account is locked
    
    // Simulate user lookup
    const user = {
      id: 'user_123',
      email,
      passwordHash: await bcrypt.hash('Password123!', 12), // In real app, get from DB
      role: 'admin',
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    };
    
    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      logAuthentication('login', user.id, req.ip || 'unknown', false, { reason: 'account_locked' });
      sendError(res, 423, 'Account is temporarily locked', 'ACCOUNT_LOCKED');
      return;
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      
      // Lock account after 5 failed attempts
      if (failedAttempts >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        logAuthentication('login', user.id, req.ip || 'unknown', false, { 
          reason: 'too_many_failed_attempts',
          failedAttempts,
          lockedUntil: lockUntil 
        });
        sendError(res, 423, 'Account locked due to too many failed attempts', 'ACCOUNT_LOCKED');
        return;
      }
      
      logAuthentication('login', user.id, req.ip || 'unknown', false, { 
        reason: 'invalid_password',
        failedAttempts 
      });
      sendError(res, 401, 'Invalid credentials', 'INVALID_CREDENTIALS');
      return;
    }
    
    // Reset failed login attempts on successful login
    // In real app: await user.update({ failedLoginAttempts: 0, lockedUntil: null });
    
    // Generate tokens
    const accessToken = JWTService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: getPermissionsForRole(user.role),
    });
    
    const refreshToken = JWTService.generateRefreshToken({
      userId: user.id,
      tokenVersion: 1,
    });
    
    // Reset brute force counter
    await securityMiddleware.resetBruteForceCounter()(req, res, () => {});
    
    logAuthentication('login', user.id, req.ip || 'unknown', true, { role: user.role });
    
    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      },
    }, 'Login successful');
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
    if (payload.tokenVersion !== currentVersion) {
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
    
    sendSuccess(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 24 * 60 * 60,
    }, 'Token refreshed successfully');
  })
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (blacklist token)
 * @access  Private
 */
router.post(
  '/logout',
  authMiddleware.verifyToken,
  authMiddleware.logout,
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
  authMiddleware.verifyToken,
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
  authMiddleware.verifyToken,
  ValidationMiddleware.validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', 'NO_AUTH');
      return;
    }
    
    const { currentPassword, newPassword } = req.body;
    
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
  securityMiddleware.bruteForceProtection(),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    
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
    const { token, newPassword } = req.body;
    
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
  authMiddleware.verifyToken,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', 'NO_AUTH');
      return;
    }
    
    // In real app, get user details from database
    const userProfile = {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      permissions: req.user.permissions,
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    
    sendSuccess(res, userProfile, 'User profile retrieved successfully');
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
  };
  
  return permissions[role] || permissions.student;
}

export default router;