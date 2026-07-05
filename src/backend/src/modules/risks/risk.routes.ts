import { Router, Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendError } from '../../middleware/errorMiddleware';
import database from '../../config/database';

const router = Router();

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
    const sequelize = database.getSequelize();
    
    const [results] = await sequelize.query(
      `SELECT id, title, description, category, severity, likelihood, risk_score, status, department, owner_id, source, impact_description, root_cause, existing_controls, treatment_strategy, residual_severity, residual_likelihood, target_date, closed_at, tags, metadata, created_by, organisation_id, created_at, updated_at
       FROM risks
       WHERE organisation_id = :orgId
       ORDER BY created_at DESC`,
      { replacements: { orgId: organisationId }, type: QueryTypes.SELECT }
    );

    sendSuccess(res, results, 'Risks retrieved successfully');
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
    const sequelize = database.getSequelize();
    
    const [results] = await sequelize.query(
      `SELECT * FROM risks WHERE id = :id AND organisation_id = :orgId`,
      { replacements: { id: req.params.id, orgId: organisationId } }
    );

    if (!(results as any[]).length) {
      sendError(res, 404, 'Risk not found', 'RISK_NOT_FOUND');
      return;
    }

    sendSuccess(res, (results as any[])[0], 'Risk retrieved successfully');
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
    const sequelize = database.getSequelize();
    
    const id = `risk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    await sequelize.query(
      `INSERT INTO risks (id, title, description, category, severity, likelihood, status, department, owner_id, impact_description, existing_controls, created_by, organisation_id, created_at, updated_at)
       VALUES (:id, :title, :description, :category, :severity, :likelihood, 'identified', :department, :ownerId, :impactDescription, :existingControls, :createdBy, :orgId, NOW(), NOW())`,
      {
        replacements: {
          id,
          title: req.body.title || '',
          description: req.body.description || null,
          category: req.body.category || null,
          severity: req.body.severity || 'medium',
          likelihood: req.body.likelihood || 'possible',
          department: req.body.department || null,
          ownerId: user.userId,
          impactDescription: req.body.impactDescription || null,
          existingControls: req.body.existingControls || null,
          createdBy: user.userId,
          orgId: user.organisationId,
        }
      }
    );

    const [rows] = await sequelize.query(`SELECT * FROM risks WHERE id = :id`, { replacements: { id } });
    sendSuccess(res, (rows as any[])[0], 'Risk created successfully');
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
    const sequelize = database.getSequelize();

    // Build SET clause dynamically from req.body
    const fields = ['title', 'description', 'category', 'severity', 'likelihood', 'status', 'department', 'owner_id', 'impact_description', 'existing_controls', 'treatment_strategy'];
    const updates: string[] = [];
    const replacements: any = { id: req.params.id, orgId: organisationId };
    
    for (const f of fields) {
      const camelField = f.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (req.body[camelField] !== undefined) {
        updates.push(`${f} = :${f}`);
        replacements[f] = req.body[camelField];
      }
    }
    const setClause = updates.join(', ');

    if (setClause) {
      await sequelize.query(
        `UPDATE risks SET ${setClause}, updated_at = NOW() WHERE id = :id AND organisation_id = :orgId`,
        { replacements }
      );
    }

    const [rows] = await sequelize.query(
      `SELECT * FROM risks WHERE id = :id AND organisation_id = :orgId`,
      { replacements: { id: req.params.id, orgId: organisationId } }
    );

    if (!(rows as any[]).length) {
      sendError(res, 404, 'Risk not found', 'RISK_NOT_FOUND');
      return;
    }

    sendSuccess(res, (rows as any[])[0], 'Risk updated successfully');
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
    const sequelize = database.getSequelize();
    
    const [rows] = await sequelize.query(
      `DELETE FROM risks WHERE id = :id AND organisation_id = :orgId RETURNING id`,
      { replacements: { id: req.params.id, orgId: organisationId } }
    );

    if (!(rows as any[]).length) {
      sendError(res, 404, 'Risk not found', 'RISK_NOT_FOUND');
      return;
    }

    sendSuccess(res, null, 'Risk deleted successfully');
  })
);

export default router;
