import { Router, Request, Response } from 'express';
import InternalControl from '../../models/InternalControl';
import User from '../../models/User';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendError } from '../../middleware/errorMiddleware';
import { Op } from 'sequelize';

const router = Router();

// Initialize middleware
let authMiddleware: AuthMiddleware;

export const initializeControlRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

const authGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

/**
 * @route   GET /api/v1/controls
 * @desc    Get all controls for the current organisation
 * @access  Private
 */
router.get(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;

    const controls = await InternalControl.findAll({
      where: { organisationId },
      order: [['createdAt', 'DESC']],
    });

    sendSuccess(res, controls, 'Controls retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/controls/summary
 * @desc    Get control summary statistics for the current organisation
 * @access  Private
 */
router.get(
  '/summary',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;

    const [total, statusCounts, effectivenessCounts] = await Promise.all([
      InternalControl.count({ where: { organisationId } }),
      InternalControl.findAll({
        where: { organisationId },
        attributes: ['status', [InternalControl.sequelize!.fn('COUNT', InternalControl.sequelize!.col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      InternalControl.findAll({
        where: { organisationId },
        attributes: [
          'designEffectiveness',
          [InternalControl.sequelize!.fn('COUNT', InternalControl.sequelize!.col('id')), 'count'],
        ],
        group: ['designEffectiveness'],
        raw: true,
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of statusCounts as any[]) {
      statusMap[row.status || 'unknown'] = parseInt(row.count, 10);
    }

    const effectivenessMap: Record<string, number> = {};
    for (const row of effectivenessCounts as any[]) {
      effectivenessMap[row.designEffectiveness || 'not_rated'] = parseInt(row.count, 10);
    }

    sendSuccess(res, {
      total,
      byStatus: statusMap,
      byDesignEffectiveness: effectivenessMap,
    }, 'Control summary retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/controls/:id
 * @desc    Get control by ID (scoped to organisation)
 * @access  Private
 */
router.get(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;

    const control = await InternalControl.findOne({
      where: {
        id: req.params.id,
        organisationId,
      },
    });

    if (!control) {
      sendError(res, 404, 'Control not found', 'NOT_FOUND');
      return;
    }

    sendSuccess(res, control, 'Control retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/controls
 * @desc    Create a new control
 * @access  Private
 */
router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;

    const newControl = await InternalControl.create({
      ...req.body,
      createdBy: user.userId,
      organisationId: user.organisationId,
    });

    sendSuccess(res, newControl, 'Control created successfully', 201);
  })
);

/**
 * @route   PUT /api/v1/controls/:id
 * @desc    Update a control (scoped to organisation)
 * @access  Private
 */
router.put(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;

    const control = await InternalControl.findOne({
      where: {
        id: req.params.id,
        organisationId,
      },
    });

    if (!control) {
      sendError(res, 404, 'Control not found', 'NOT_FOUND');
      return;
    }

    await control.update(req.body);

    sendSuccess(res, control, 'Control updated successfully');
  })
);

/**
 * @route   DELETE /api/v1/controls/:id
 * @desc    Delete a control (scoped to organisation)
 * @access  Private
 */
router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;

    const control = await InternalControl.findOne({
      where: {
        id: req.params.id,
        organisationId,
      },
    });

    if (!control) {
      sendError(res, 404, 'Control not found', 'NOT_FOUND');
      return;
    }

    await control.destroy();

    sendSuccess(res, null, 'Control deleted successfully');
  })
);

export default router;
