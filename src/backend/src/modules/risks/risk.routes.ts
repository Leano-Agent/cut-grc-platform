import { Router, Request, Response } from 'express';
import Risk from '../../models/Risk';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendError } from '../../middleware/errorMiddleware';
import database from '../../config/database';

const router = Router();

// Initialize middleware
let authMiddleware: AuthMiddleware;

export const initializeRiskRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

const authGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

/**
 * @route   GET /api/v1/risks
 * @desc    Get all risks for the current organisation
 * @access  Private
 */
router.get(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;

    // Use raw query to get risks with owner name (avoids Sequelize association issues)
    const sequelize = database.getSequelize();
    const [results] = await sequelize.query(
      `SELECT r.*, 
              u.first_name AS "owner.firstName", 
              u.last_name AS "owner.lastName",
              u.email AS "owner.email",
              u.id AS "owner.id"
       FROM risks r
       LEFT JOIN users u ON r.owner_id = u.id
       WHERE r.organisation_id = :orgId
       ORDER BY r.created_at DESC`,
      { replacements: { orgId: organisationId } }
    );

    // Format the results: flatten owner.* into nested owner object
    const formatted = (results as any[]).map(r => {
      const owner = r['owner.id'] ? {
        id: r['owner.id'],
        firstName: r['owner.firstName'],
        lastName: r['owner.lastName'],
        email: r['owner.email'],
      } : null;
      // Remove the flattened fields
      const { 'owner.firstName': _1, 'owner.lastName': _2, 'owner.email': _3, 'owner.id': _4, ...rest } = r as any;
      return { ...rest, owner };
    });

    sendSuccess(res, formatted, 'Risks retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/risks/:id
 * @desc    Get risk by ID (scoped to organisation)
 * @access  Private
 */
router.get(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;
    const risk = await Risk.findOne({ where: { id: req.params.id, organisationId } });

    if (!risk) {
      sendError(res, 404, 'Risk not found', 'RISK_NOT_FOUND');
      return;
    }

    sendSuccess(res, risk, 'Risk retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/risks
 * @desc    Create a new risk
 * @access  Private
 */
router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    const risk = await Risk.create({
      ...req.body,
      createdBy: user.userId,
      organisationId: user.organisationId,
    });

    sendSuccess(res, risk, 'Risk created successfully');
  })
);

/**
 * @route   PUT /api/v1/risks/:id
 * @desc    Update a risk
 * @access  Private
 */
router.put(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;
    const risk = await Risk.findOne({ where: { id: req.params.id, organisationId } });

    if (!risk) {
      sendError(res, 404, 'Risk not found', 'RISK_NOT_FOUND');
      return;
    }

    await risk.update(req.body);
    sendSuccess(res, risk, 'Risk updated successfully');
  })
);

/**
 * @route   DELETE /api/v1/risks/:id
 * @desc    Delete a risk
 * @access  Private
 */
router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;
    const risk = await Risk.findOne({ where: { id: req.params.id, organisationId } });

    if (!risk) {
      sendError(res, 404, 'Risk not found', 'RISK_NOT_FOUND');
      return;
    }

    await risk.destroy();
    sendSuccess(res, null, 'Risk deleted successfully');
  })
);

export default router;
