import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import ComplianceRequirement from '../../models/ComplianceRequirement';
import User from '../../models/User';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendError } from '../../middleware/errorMiddleware';

const router = Router();

// Initialize middleware
let authMiddleware: AuthMiddleware;

export const initializeComplianceRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

const authGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

/**
 * @route   GET /api/v1/compliance
 * @desc    Get all compliance requirements for the current organisation
 * @access  Private
 */
router.get(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;

    const items = await ComplianceRequirement.findAll({
      where: { organisationId },
      order: [['createdAt', 'DESC']],
    });

    sendSuccess(res, items, 'Compliance requirements retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/compliance/summary
 * @desc    Get compliance summary counts for the current organisation
 * @access  Private
 */
router.get(
  '/summary',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;

    const [total, compliant, nonCompliant, partial, notAssessed, underReview] =
      await Promise.all([
        ComplianceRequirement.count({ where: { organisationId } }),
        ComplianceRequirement.count({
          where: { organisationId, status: 'compliant' },
        }),
        ComplianceRequirement.count({
          where: { organisationId, status: 'non_compliant' },
        }),
        ComplianceRequirement.count({
          where: { organisationId, status: 'partial' },
        }),
        ComplianceRequirement.count({
          where: { organisationId, status: 'not_assessed' },
        }),
        ComplianceRequirement.count({
          where: { organisationId, status: 'under_review' },
        }),
      ]);

    const overallScore =
      total > 0 ? Math.round((compliant / total) * 100) : 0;

    sendSuccess(res, {
      total,
      compliant,
      nonCompliant,
      partial,
      notAssessed,
      underReview,
      overallScore,
    }, 'Compliance summary retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/compliance/trends
 * @desc    Get compliance trend scores by month (computed from last_reviewed_at dates)
 * @access  Private
 */
router.get(
  '/trends',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;

    // Get all items with a lastReviewedAt to build trend data
    const items = await ComplianceRequirement.findAll({
      where: {
        organisationId,
        lastReviewedAt: { [Op.ne]: null },
      },
      attributes: ['status', 'lastReviewedAt'],
    });

    // Build month-to-month trend buckets based on lastReviewedAt
    const monthBuckets: Record<string, { total: number; compliant: number }> =
      {};

    for (const item of items) {
      if (!item.lastReviewedAt) continue;
      const monthKey = `${item.lastReviewedAt.getFullYear()}-${String(
        item.lastReviewedAt.getMonth() + 1
      ).padStart(2, '0')}`;

      if (!monthBuckets[monthKey]) {
        monthBuckets[monthKey] = { total: 0, compliant: 0 };
      }

      monthBuckets[monthKey].total += 1;
      if (item.status === 'compliant') {
        monthBuckets[monthKey].compliant += 1;
      }
    }

    const trends = Object.entries(monthBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        score: data.total > 0
          ? Math.round((data.compliant / data.total) * 100)
          : 0,
      }));

    sendSuccess(res, trends, 'Compliance trends retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/compliance/:id
 * @desc    Get compliance requirement by ID (scoped to organisation)
 * @access  Private
 */
router.get(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;

    const item = await ComplianceRequirement.findOne({
      where: {
        id: req.params.id,
        organisationId,
      },
    });

    if (!item) {
      sendError(res, 404, 'Compliance requirement not found', 'NOT_FOUND');
      return;
    }

    sendSuccess(res, item, 'Compliance requirement retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/compliance
 * @desc    Create a new compliance requirement
 * @access  Private
 */
router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;

    const newItem = await ComplianceRequirement.create({
      ...req.body,
      createdBy: user.userId,
      organisationId: user.organisationId,
    });

    // Re-fetch to return the created item
    const createdItem = await ComplianceRequirement.findByPk(newItem.id);

    sendSuccess(res, createdItem, 'Compliance requirement created successfully', 201);
  })
);

/**
 * @route   PUT /api/v1/compliance/:id
 * @desc    Update a compliance requirement (scoped to organisation)
 * @access  Private
 */
router.put(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;

    const item = await ComplianceRequirement.findOne({
      where: {
        id: req.params.id,
        organisationId,
      },
    });

    if (!item) {
      sendError(res, 404, 'Compliance requirement not found', 'NOT_FOUND');
      return;
    }

    await item.update(req.body);

    sendSuccess(res, item, 'Compliance requirement updated successfully');
  })
);

/**
 * @route   DELETE /api/v1/compliance/:id
 * @desc    Delete a compliance requirement (scoped to organisation)
 * @access  Private
 */
router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;

    const item = await ComplianceRequirement.findOne({
      where: {
        id: req.params.id,
        organisationId,
      },
    });

    if (!item) {
      sendError(res, 404, 'Compliance requirement not found', 'NOT_FOUND');
      return;
    }

    await item.destroy();

    sendSuccess(res, null, 'Compliance requirement deleted successfully');
  })
);

export default router;
