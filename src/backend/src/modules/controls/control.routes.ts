import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendError } from '../../middleware/errorMiddleware';
import database from '../../config/database';

const router = Router();
let authMiddleware: AuthMiddleware;

export const initializeControlRoutes = (redisClient: any) => {
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
      `SELECT * FROM internal_controls WHERE organisation_id = :orgId ORDER BY created_at DESC`,
      { replacements: { orgId } }
    );
    sendSuccess(res, rows, 'Controls retrieved successfully');
  })
);

router.get(
  '/summary',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const [statusRows] = await db().query(
      `SELECT status, COUNT(*)::int as count FROM internal_controls WHERE organisation_id = :orgId GROUP BY status`,
      { replacements: { orgId } }
    );
    const [effRows] = await db().query(
      `SELECT design_effectiveness, COUNT(*)::int as count FROM internal_controls WHERE organisation_id = :orgId AND design_effectiveness IS NOT NULL GROUP BY design_effectiveness`,
      { replacements: { orgId } }
    );
    const byStatus: Record<string, number> = {};
    const byEff: Record<string, number> = {};
    let total = 0;
    for (const r of statusRows as any[]) { byStatus[r.status] = r.count; total += r.count; }
    for (const r of effRows as any[]) { byEff[r.design_effectiveness] = r.count; }
    sendSuccess(res, { total, byStatus, byDesignEffectiveness: byEff }, 'Control summary retrieved');
  })
);

router.get(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const [rows] = await db().query(
      `SELECT * FROM internal_controls WHERE id = :id AND organisation_id = :orgId`,
      { replacements: { id: req.params.id, orgId } }
    );
    if (!(rows as any[]).length) { sendError(res, 404, 'Control not found', 'NOT_FOUND'); return; }
    sendSuccess(res, (rows as any[])[0], 'Control retrieved successfully');
  })
);

router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const orgId = user?.organisationId || ORG_ID;
    const id = `ctrl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db().query(
      `INSERT INTO internal_controls (id, title, description, control_type, frequency, status, department, owner_id, risk_id, design_effectiveness, operational_effectiveness, created_by, organisation_id, created_at, updated_at)
       VALUES (:id, :title, :desc, :type, :freq, 'active', :dept, :ownerId, :riskId, :designEff, :operEff, :userId, :orgId, NOW(), NOW())`,
      { replacements: { id, title: req.body.title || '', desc: req.body.description || null, type: req.body.controlType || 'preventive', freq: req.body.frequency || 'monthly', dept: req.body.department || null, ownerId: user?.userId || null, riskId: req.body.riskId || null, designEff: req.body.designEffectiveness || null, operEff: req.body.operationalEffectiveness || null, userId: user?.userId || null, orgId } }
    );
    const [rows] = await db().query(`SELECT * FROM internal_controls WHERE id = :id`, { replacements: { id } });
    sendSuccess(res, (rows as any[])[0], 'Control created successfully', 201);
  })
);

router.put(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const allowed = ['title', 'description', 'control_type', 'frequency', 'status', 'department', 'owner_id', 'design_effectiveness', 'operational_effectiveness'];
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
      await db().query(`UPDATE internal_controls SET ${updates.join(', ')}, updated_at = NOW() WHERE id = :id AND organisation_id = :orgId`, { replacements });
    }
    const [rows] = await db().query(`SELECT * FROM internal_controls WHERE id = :id AND organisation_id = :orgId`, { replacements: { id: req.params.id, orgId } });
    if (!(rows as any[]).length) { sendError(res, 404, 'Control not found', 'NOT_FOUND'); return; }
    sendSuccess(res, (rows as any[])[0], 'Control updated successfully');
  })
);

router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const [rows] = await db().query(`DELETE FROM internal_controls WHERE id = :id AND organisation_id = :orgId RETURNING id`, { replacements: { id: req.params.id, orgId } });
    if (!(rows as any[]).length) { sendError(res, 404, 'Control not found', 'NOT_FOUND'); return; }
    sendSuccess(res, null, 'Control deleted successfully');
  })
);

export default router;
