import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/errorMiddleware';

const router = Router();

let authMiddleware: AuthMiddleware;

export const initializeUserRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

const authGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

const adminGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.requireAnyRole(['admin'])(req, res, next) : next();

// In-memory store seeded with demo data
let users: any[] = [
  {
    id: 'user_1',
    email: 'grcadmin@tyriie.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    department: 'IT',
    isActive: true,
    lastLogin: '2024-01-20T10:30:00Z',
    createdAt: '2024-01-01T08:00:00Z',
  },
  {
    id: 'user_2',
    email: 'manager@municipal.gov',
    firstName: 'Department',
    lastName: 'Manager',
    role: 'manager',
    department: 'Finance',
    isActive: true,
    lastLogin: '2024-01-19T14:20:00Z',
    createdAt: '2024-01-02T09:00:00Z',
  },
];
let nextId = 3;

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get(
  '/',
  authGuard,
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: users });
  })
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin)
 */
router.get(
  '/:id',
  authGuard,
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ data: user });
  })
);

/**
 * @route   POST /api/v1/users
 * @desc    Create a new user
 * @access  Private (Admin)
 */
router.post(
  '/',
  authGuard,
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const newUser = {
      id: `user_${nextId++}`,
      email: req.body.email,
      firstName: req.body.firstName || '',
      lastName: req.body.lastName || '',
      role: req.body.role || 'user',
      department: req.body.department || '',
      isActive: true,
      lastLogin: null,
      createdAt: new Date().toISOString(),
    };
    users.unshift(newUser);
    res.status(201).json({ data: newUser });
  })
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update a user
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  authGuard,
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    users[index] = { ...users[index], ...req.body, id: users[index].id, createdAt: users[index].createdAt };
    res.json({ data: users[index] });
  })
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete a user
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  authGuard,
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    users.splice(index, 1);
    res.json({ message: 'User deleted successfully' });
  })
);

/**
 * @route   PUT /api/v1/users/:id/status
 * @desc    Toggle user active status
 * @access  Private (Admin)
 */
router.put(
  '/:id/status',
  authGuard,
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    users[index].isActive = !users[index].isActive;
    res.json({ data: users[index] });
  })
);

export default router;
