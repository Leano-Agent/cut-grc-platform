import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/errorMiddleware';
import bcrypt from 'bcryptjs';
import User from '../../models/User';
import Organisation from '../../models/Organisation';

const router = Router();

let authMiddleware: AuthMiddleware;

export const initializeUserRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

const authGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

const adminGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.requireAnyRole(['admin'])(req, res, next) : next();

/**
 * @route   GET /api/v1/users
 * @desc    Get all users for the current organisation (admin only)
 * @access  Private (Admin)
 */
router.get(
  '/',
  authGuard,
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = req.user!.organisationId;

    const users = await User.findAll({
      where: { organisationId },
      attributes: { exclude: ['passwordHash'] },
    });

    res.json({ data: users });
  })
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID within the current organisation
 * @access  Private (Admin)
 */
router.get(
  '/:id',
  authGuard,
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = req.user!.organisationId;

    const user = await User.findOne({
      where: { id: req.params.id, organisationId },
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ data: user });
  })
);

/**
 * @route   POST /api/v1/users
 * @desc    Create a new user within the current organisation
 * @access  Private (Admin)
 */
router.post(
  '/',
  authGuard,
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = req.user!.organisationId;

    const {
      email,
      password,
      firstName,
      lastName,
      role,
      orgRole,
    } = req.body;

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      email,
      passwordHash,
      firstName: firstName || '',
      lastName: lastName || '',
      role: role || 'staff',
      organisationId,
      orgRole: orgRole || 'member',
    });

    // Fetch without passwordHash for response
    const user = await User.findByPk(newUser.id, {
      attributes: { exclude: ['passwordHash'] },
    });

    res.status(201).json({ data: user });
  })
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update a user within the current organisation
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  authGuard,
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = req.user!.organisationId;

    const user = await User.findOne({
      where: { id: req.params.id, organisationId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const {
      email,
      password,
      firstName,
      lastName,
      role,
      orgRole,
      isActive,
    } = req.body;

    const updateData: Record<string, unknown> = {};

    if (email !== undefined) updateData.email = email;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (role !== undefined) updateData.role = role;
    if (orgRole !== undefined) updateData.orgRole = orgRole;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    await user.update(updateData);

    // Fetch fresh data without passwordHash
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['passwordHash'] },
    });

    res.json({ data: updatedUser });
  })
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete a user within the current organisation
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  authGuard,
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = req.user!.organisationId;

    const user = await User.findOne({
      where: { id: req.params.id, organisationId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  })
);

/**
 * @route   PUT /api/v1/users/:id/status
 * @desc    Toggle user active status within the current organisation
 * @access  Private (Admin)
 */
router.put(
  '/:id/status',
  authGuard,
  adminGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = req.user!.organisationId;

    const user = await User.findOne({
      where: { id: req.params.id, organisationId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Toggle isActive
    await user.update({ isActive: !user.isActive });

    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['passwordHash'] },
    });

    res.json({ data: updatedUser });
  })
);

export default router;
