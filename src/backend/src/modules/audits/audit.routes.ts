import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendError } from '../../middleware/errorMiddleware';
import database from '../../config/database';

const router = Router();

let authMiddleware: AuthMiddleware;

export const initializeAuditRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

const authGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

const ORG_ID = '00000000-0000-0000-0000-000000000001';
const db = () => database.getSequelize();

/**
 * @route   GET /api/v1/audits/summary
 * @desc    Get audit summary statistics for the current organisation
 * @access  Private
 */
router.get(
  '/summary',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const [statusRows] = await db().query(
      `SELECT status, COUNT(*)::int as count FROM audits WHERE organisation_id = :orgId GROUP BY status`,
      { replacements: { orgId } }
    );
    const [overdueRows] = await db().query(
      `SELECT COUNT(*)::int as count FROM audits WHERE organisation_id = :orgId AND status != 'completed' AND due_date < NOW()`,
      { replacements: { orgId } }
    );
    const counts: Record<string, number> = {};
    let total = 0;
    for (const r of statusRows as any[]) {
      counts[r.status] = r.count;
      total += r.count;
    }
    sendSuccess(res, {
      total,
      completed: counts['completed'] || 0,
      inProgress: counts['in_progress'] || 0,
      planned: counts['planned'] || 0,
      overdue: (overdueRows as any[])[0]?.count || 0,
    }, 'Audit summary retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/audits
 * @desc    Get all audits for the current organisation
 * @access  Private
 */
router.get(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const [rows] = await db().query(
      `SELECT * FROM audits WHERE organisation_id = :orgId ORDER BY created_at DESC`,
      { replacements: { orgId } }
    );
    sendSuccess(res, rows, 'Audits retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/audits
 * @desc    Create a new audit (scoped to organisation)
 * @access  Private
 */
router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const orgId = user?.organisationId || ORG_ID;
    const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db().query(
      `INSERT INTO audits (id, title, type, status, priority, scope, department, auditor, auditee, scheduled_start, scheduled_end, findings, recommendations, due_date, created_by, organisation_id, created_at, updated_at)
       VALUES (:id, :title, :type, :status, :priority, :scope, :department, :auditor, :auditee, :scheduledStart, :scheduledEnd, :findings, :recommendations, :dueDate, :userId, :orgId, NOW(), NOW())`,
      {
        replacements: {
          id,
          title: req.body.title || '',
          type: req.body.type || 'internal',
          status: req.body.status || 'planned',
          priority: req.body.priority || 'medium',
          scope: req.body.scope || null,
          department: req.body.department || null,
          auditor: req.body.auditor || null,
          auditee: req.body.auditee || null,
          scheduledStart: req.body.scheduledStart || null,
          scheduledEnd: req.body.scheduledEnd || null,
          findings: req.body.findings != null ? req.body.findings : 0,
          recommendations: req.body.recommendations != null ? req.body.recommendations : 0,
          dueDate: req.body.dueDate || null,
          userId: user?.userId || null,
          orgId,
        },
      }
    );
    const [rows] = await db().query(`SELECT * FROM audits WHERE id = :id`, { replacements: { id } });
    sendSuccess(res, (rows as any[])[0], 'Audit created successfully', 201);
  })
);

/**
 * @route   PUT /api/v1/audits/:id
 * @desc    Update an audit (scoped to organisation)
 * @access  Private
 */
router.put(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const allowed = ['title', 'type', 'status', 'priority', 'scope', 'department', 'auditor', 'auditee', 'scheduled_start', 'scheduled_end', 'findings', 'recommendations', 'due_date'];
    const updates: string[] = [];
    const replacements: any = { id: req.params.id, orgId };
    for (const f of allowed) {
      const camel = f.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (req.body[camel] !== undefined) {
        updates.push(`${f} = :${f}`);
        replacements[f] = req.body[camel];
      }
    }
    if (updates.length) {
      await db().query(
        `UPDATE audits SET ${updates.join(', ')}, updated_at = NOW() WHERE id = :id AND organisation_id = :orgId`,
        { replacements }
      );
    }
    const [rows] = await db().query(
      `SELECT * FROM audits WHERE id = :id AND organisation_id = :orgId`,
      { replacements: { id: req.params.id, orgId } }
    );
    if (!(rows as any[]).length) {
      sendError(res, 404, 'Audit not found', 'NOT_FOUND');
      return;
    }
    sendSuccess(res, (rows as any[])[0], 'Audit updated successfully');
  })
);

/**
 * @route   DELETE /api/v1/audits/:id
 * @desc    Delete an audit (scoped to organisation)
 * @access  Private
 */
router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const [rows] = await db().query(
      `DELETE FROM audits WHERE id = :id AND organisation_id = :orgId RETURNING id`,
      { replacements: { id: req.params.id, orgId } }
    );
    if (!(rows as any[]).length) {
      sendError(res, 404, 'Audit not found', 'NOT_FOUND');
      return;
    }
    sendSuccess(res, null, 'Audit deleted successfully');
  })
);

export default router;
