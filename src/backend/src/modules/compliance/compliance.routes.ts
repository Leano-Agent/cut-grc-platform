import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendError } from '../../middleware/errorMiddleware';
import database from '../../config/database';

const router = Router();

let authMiddleware: AuthMiddleware;

export const initializeComplianceRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

const authGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

const ORG_ID = '00000000-0000-0000-0000-000000000001';
const db = () => database.getSequelize();

router.get(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const [rows] = await db().query(
      `SELECT * FROM compliance_requirements WHERE organisation_id = :orgId ORDER BY created_at DESC`,
      { replacements: { orgId } }
    );
    sendSuccess(res, rows, 'Compliance requirements retrieved successfully');
  })
);

router.get(
  '/summary',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const [rows] = await db().query(
      `SELECT status, COUNT(*)::int as count FROM compliance_requirements WHERE organisation_id = :orgId GROUP BY status`,
      { replacements: { orgId } }
    );
    const counts: Record<string, number> = {};
    let total = 0;
    for (const r of rows as any[]) {
      counts[r.status] = r.count;
      total += r.count;
    }
    sendSuccess(res, {
      total,
      compliant: counts['compliant'] || 0,
      nonCompliant: counts['non_compliant'] || 0,
      partial: counts['partial'] || 0,
      notAssessed: counts['not_assessed'] || 0,
      underReview: counts['under_review'] || 0,
      overallScore: total > 0 ? Math.round(((counts['compliant'] || 0) / total) * 100) : 0,
    }, 'Compliance summary retrieved successfully');
  })
);

router.get(
  '/trends',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const [rows] = await db().query(
      `SELECT to_char(last_reviewed_at, 'YYYY-MM') as month, status 
       FROM compliance_requirements 
       WHERE organisation_id = :orgId AND last_reviewed_at IS NOT NULL
       ORDER BY last_reviewed_at`,
      { replacements: { orgId } }
    );
    const buckets: Record<string, { total: number; compliant: number }> = {};
    for (const r of rows as any[]) {
      if (!buckets[r.month]) buckets[r.month] = { total: 0, compliant: 0 };
      buckets[r.month].total++;
      if (r.status === 'compliant') buckets[r.month].compliant++;
    }
    const trends = Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d]) => ({ month, score: d.total > 0 ? Math.round((d.compliant / d.total) * 100) : 0 }));
    sendSuccess(res, trends, 'Compliance trends retrieved successfully');
  })
);

router.get(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const [rows] = await db().query(
      `SELECT * FROM compliance_requirements WHERE id = :id AND organisation_id = :orgId`,
      { replacements: { id: req.params.id, orgId } }
    );
    if (!(rows as any[]).length) {
      sendError(res, 404, 'Compliance requirement not found', 'NOT_FOUND');
      return;
    }
    sendSuccess(res, (rows as any[])[0], 'Compliance requirement retrieved successfully');
  })
);

router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const orgId = user?.organisationId || ORG_ID;
    const id = `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db().query(
      `INSERT INTO compliance_requirements (id, title, description, regulation_source, category, status, department, owner_id, created_by, organisation_id, created_at, updated_at)
       VALUES (:id, :title, :desc, :src, :cat, :status, :dept, :ownerId, :createdBy, :orgId, NOW(), NOW())`,
      { replacements: { id, title: req.body.title || '', desc: req.body.description || null, src: req.body.regulationSource || null, cat: req.body.category || null, status: req.body.status || 'not_assessed', dept: req.body.department || null, ownerId: user?.userId || null, createdBy: user?.userId || null, orgId } }
    );
    const [rows] = await db().query(`SELECT * FROM compliance_requirements WHERE id = :id`, { replacements: { id } });
    sendSuccess(res, (rows as any[])[0], 'Compliance requirement created successfully', 201);
  })
);

router.put(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const allowed = ['title', 'description', 'regulation_source', 'category', 'status', 'department', 'owner_id'];
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
        `UPDATE compliance_requirements SET ${updates.join(', ')}, updated_at = NOW() WHERE id = :id AND organisation_id = :orgId`,
        { replacements }
      );
    }
    const [rows] = await db().query(
      `SELECT * FROM compliance_requirements WHERE id = :id AND organisation_id = :orgId`,
      { replacements: { id: req.params.id, orgId } }
    );
    if (!(rows as any[]).length) {
      sendError(res, 404, 'Compliance requirement not found', 'NOT_FOUND');
      return;
    }
    sendSuccess(res, (rows as any[])[0], 'Compliance requirement updated successfully');
  })
);

router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const [rows] = await db().query(
      `DELETE FROM compliance_requirements WHERE id = :id AND organisation_id = :orgId RETURNING id`,
      { replacements: { id: req.params.id, orgId } }
    );
    if (!(rows as any[]).length) {
      sendError(res, 404, 'Compliance requirement not found', 'NOT_FOUND');
      return;
    }
    sendSuccess(res, null, 'Compliance requirement deleted successfully');
  })
);

export default router;
