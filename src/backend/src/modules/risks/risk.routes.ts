import { Router, Request, Response } from 'express';
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
      `SELECT r.*, 
              u.id AS owner__id, 
              u.first_name AS owner__firstName, 
              u.last_name AS owner__lastName,
              u.email AS owner__email
       FROM risks r
       LEFT JOIN users u ON r.owner_id = u.id
       WHERE r.organisation_id = :orgId
       ORDER BY r.created_at DESC`,
      { replacements: { orgId: organisationId } }
    );

    // Build owner object from flattened fields
    const formatted = (results as any[]).map(r => {
      const owner = r.owner__id ? {
        id: r.owner__id,
        firstName: r.owner__firstName,
        lastName: r.owner__lastName,
        email: r.owner__email,
      } : null;
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        severity: r.severity,
        likelihood: r.likelihood,
        riskScore: r.risk_score,
        status: r.status,
        department: r.department,
        ownerId: r.owner_id,
        owner,
        source: r.source,
        impactDescription: r.impact_description,
        rootCause: r.root_cause,
        existingControls: r.existing_controls,
        treatmentStrategy: r.treatment_strategy,
        residualSeverity: r.residual_severity,
        residualLikelihood: r.residual_likelihood,
        targetDate: r.target_date,
        closedAt: r.closed_at,
        tags: r.tags,
        metadata: r.metadata,
        createdBy: r.created_by,
        organisationId: r.organisation_id,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
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
