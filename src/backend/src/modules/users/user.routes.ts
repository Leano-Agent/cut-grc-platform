import { Router } from 'express';
import { z } from 'zod';
import { ValidationMiddleware } from '../../middleware/validation.middleware';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess } from '../../middleware/errorMiddleware';

const router = Router();

// Initialize middleware
let authMiddleware: AuthMiddleware;

export const initializeUserRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get(
  '/',
  authMiddleware.verifyToken,
  authMiddleware.requireRole(['admin'] as any),
  asyncHandler(async (req, res) => {
    // Mock users data
    const users = [
      {
        id: 'user_1',
        email: 'admin@municipal.gov',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        department: 'IT',
        isActive: true,
        lastLogin: '2024-01-20T10:30:00Z'
      },
      {
        id: 'user_2',
        email: 'manager@municipal.gov',
        firstName: 'Department',
        lastName: 'Manager',
        role: 'manager',
        department: 'Finance',
        isActive: true,
        lastLogin: '2024-01-19T14:20:00Z'
      }
    ];
    
    sendSuccess(res, users, 'Users retrieved successfully');
  })
);

export default router;