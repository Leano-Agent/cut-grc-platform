import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendError } from '../../middleware/errorMiddleware';
import database from '../../config/database';

const router = Router();
let authMiddleware: AuthMiddleware;

export const initializeUserRoutes = (redisClient: any) => {
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
      `SELECT id, email, first_name, last_name, role, department, is_active, last_login_at, created_at 
       FROM users WHERE organisation_id = :orgId ORDER BY created_at DESC`,
      { replacements: { orgId } }
    );
    sendSuccess(res, rows, 'Users retrieved successfully');
  })
);

router.get(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const [rows] = await db().query(
      `SELECT id, email, first_name, last_name, role, department, is_active, last_login_at, created_at 
       FROM users WHERE id = :id AND organisation_id = :orgId`,
      { replacements: { id: req.params.id, orgId } }
    );
    if (!(rows as any[]).length) { sendError(res, 404, 'User not found', 'USER_NOT_FOUND'); return; }
    sendSuccess(res, (rows as any[])[0], 'User retrieved successfully');
  })
);

router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const orgId = user?.organisationId || ORG_ID;
    const id = `user_${Date.now()}`;
    const passwordHash = await bcrypt.hash(req.body.password || 'Password123!', 12);

    await db().query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, department, organisation_id, is_active, email_verified, failed_login_attempts, refresh_token_version, created_at, updated_at)
       VALUES (:id, :email, :hash, :first, :last, :role, :dept, :orgId, true, false, 0, 1, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      { replacements: { id, email: req.body.email || '', hash: passwordHash, first: req.body.firstName || '', last: req.body.lastName || '', role: req.body.role || 'staff', dept: req.body.department || null, orgId } }
    );

    const [rows] = await db().query(
      `SELECT id, email, first_name, last_name, role, department, is_active, created_at FROM users WHERE id = :id`,
      { replacements: { id } }
    );
    sendSuccess(res, (rows as any[])[0] || null, 'User created successfully', 201);
  })
);

router.put(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const allowed = ['email', 'first_name', 'last_name', 'role', 'department', 'is_active'];
    const updates: string[] = [];
    const replacements: any = { id: req.params.id, orgId };
    for (const f of allowed) {
      const camel = f === 'first_name' ? 'firstName' : f === 'last_name' ? 'lastName' : f === 'is_active' ? 'isActive' : f;
      if (req.body[camel] !== undefined) {
        updates.push(`${f} = :${f}`);
        replacements[f] = req.body[camel];
      }
    }
    if (req.body.password) {
      const hash = await bcrypt.hash(req.body.password, 12);
      updates.push('password_hash = :pwHash');
      replacements.pwHash = hash;
    }
    if (updates.length) {
      await db().query(`UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = :id AND organisation_id = :orgId`, { replacements });
    }
    const [rows] = await db().query(
      `SELECT id, email, first_name, last_name, role, department, is_active, created_at FROM users WHERE id = :id AND organisation_id = :orgId`,
      { replacements: { id: req.params.id, orgId } }
    );
    if (!(rows as any[]).length) { sendError(res, 404, 'User not found', 'USER_NOT_FOUND'); return; }
    sendSuccess(res, (rows as any[])[0], 'User updated successfully');
  })
);

router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const [rows] = await db().query(`DELETE FROM users WHERE id = :id AND organisation_id = :orgId RETURNING id`, { replacements: { id: req.params.id, orgId } });
    if (!(rows as any[]).length) { sendError(res, 404, 'User not found', 'USER_NOT_FOUND'); return; }
    sendSuccess(res, null, 'User deleted successfully');
  })
);

router.put(
  '/:id/status',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const orgId = (req as any).user?.organisationId || ORG_ID;
    const [rows] = await db().query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = :id AND organisation_id = :orgId RETURNING id, email, first_name, last_name, role, department, is_active`,
      { replacements: { id: req.params.id, orgId } }
    );
    if (!(rows as any[]).length) { sendError(res, 404, 'User not found', 'USER_NOT_FOUND'); return; }
    sendSuccess(res, (rows as any[])[0], 'User status updated successfully');
  })
);

export default router;
