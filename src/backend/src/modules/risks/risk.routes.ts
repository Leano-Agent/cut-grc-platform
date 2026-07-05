import { Router, Request, Response } from 'express';
import Risk from '../../models/Risk';
import User from '../../models/User';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendError } from '../../middleware/errorMiddleware';

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

    const risks = await Risk.findAll({
      where: { organisationId },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    sendSuccess(res, risks, 'Risks retrieved successfully');
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

    const risk = await Risk.findOne({
      where: {
        id: req.params.id,
        organisationId,
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!risk) {
      sendError(res, 404, 'Risk not found', 'NOT_FOUND');
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

    const newRisk = await Risk.create({
      ...req.body,
      createdBy: user.userId,
      organisationId: user.organisationId,
    });

    sendSuccess(res, newRisk, 'Risk created successfully', 201);
  })
);

/**
 * @route   PUT /api/v1/risks/:id
 * @desc    Update a risk (scoped to organisation)
 * @access  Private
 */
router.put(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;

    const risk = await Risk.findOne({
      where: {
        id: req.params.id,
        organisationId,
      },
    });

    if (!risk) {
      sendError(res, 404, 'Risk not found', 'NOT_FOUND');
      return;
    }

    await risk.update(req.body);

    // Re-fetch to get the updated record with associations
    const updatedRisk = await Risk.findByPk(risk.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    sendSuccess(res, updatedRisk, 'Risk updated successfully');
  })
);

/**
 * @route   DELETE /api/v1/risks/:id
 * @desc    Delete a risk (scoped to organisation)
 * @access  Private
 */
router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;

    const risk = await Risk.findOne({
      where: {
        id: req.params.id,
        organisationId,
      },
    });

    if (!risk) {
      sendError(res, 404, 'Risk not found', 'NOT_FOUND');
      return;
    }

    await risk.destroy();

    sendSuccess(res, null, 'Risk deleted successfully');
  })
);

export default router;
