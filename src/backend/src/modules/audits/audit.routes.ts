import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendError } from '../../middleware/errorMiddleware';

const router = Router();

let authMiddleware: AuthMiddleware;

export const initializeAuditRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

const authGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

/**
 * In-memory store seeded with demo data, filtered by organisationId.
 * Audit here refers to "audit cycle management" (not immutable audit_logs).
 */

interface AuditItem {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  scope: string;
  department: string;
  auditor: string;
  auditee: string;
  scheduledStart: string;
  scheduledEnd: string;
  findings: number;
  recommendations: number;
  dueDate: string;
  createdAt: string;
  organisationId: string;
}

// Seed data with org scoping
let items: AuditItem[] = [
  { id: '1', title: 'Financial Audit Q2', type: 'financial', status: 'in_progress', priority: 'high', scope: 'Financial statements and controls', department: 'Finance', auditor: 'Audit Team A', auditee: 'Finance Dept', scheduledStart: '2026-05-01', scheduledEnd: '2026-06-30', findings: 12, recommendations: 8, dueDate: '2026-06-30', createdAt: '2026-05-01T09:00:00Z', organisationId: 'org_default' },
  { id: '2', title: 'IT Security Audit', type: 'external', status: 'completed', priority: 'high', scope: 'Network security and access controls', department: 'IT', auditor: 'External Auditor', auditee: 'IT Dept', scheduledStart: '2026-04-01', scheduledEnd: '2026-05-15', findings: 7, recommendations: 5, dueDate: '2026-05-15', createdAt: '2026-04-01T14:00:00Z', organisationId: 'org_default' },
  { id: '3', title: 'Compliance Review', type: 'compliance', status: 'planned', priority: 'medium', scope: 'Regulatory compliance assessment', department: 'Compliance', auditor: 'Compliance Dept', auditee: 'All Departments', scheduledStart: '2026-07-01', scheduledEnd: '2026-08-01', findings: 0, recommendations: 0, dueDate: '2026-08-01', createdAt: '2026-06-01T11:00:00Z', organisationId: 'org_default' },
];
let nextId = 4;

/**
 * @route   GET /api/v1/audits/summary
 * @desc    Get audit summary statistics for the current organisation
 * @access  Private
 */
router.get(
  '/summary',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const organisationId = (req as any).user.organisationId;
    const orgItems = items.filter(i => i.organisationId === organisationId);
    const now = new Date().toISOString();

    const total = orgItems.length;
    const completed = orgItems.filter(i => i.status === 'completed').length;
    const inProgress = orgItems.filter(i => i.status === 'in_progress').length;
    const planned = orgItems.filter(i => i.status === 'planned').length;
    const overdue = orgItems.filter(i => i.status !== 'completed' && i.dueDate < now).length;

    sendSuccess(res, { total, completed, inProgress, planned, overdue }, 'Audit summary retrieved successfully');
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
    const organisationId = (req as any).user.organisationId;
    const orgItems = items.filter(i => i.organisationId === organisationId);
    sendSuccess(res, orgItems, 'Audits retrieved successfully');
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
    const organisationId = (req as any).user.organisationId;

    const newItem: AuditItem = {
      id: `audit_${nextId++}`,
      ...req.body,
      organisationId,
      createdAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    sendSuccess(res, newItem, 'Audit created successfully', 201);
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
    const organisationId = (req as any).user.organisationId;
    const index = items.findIndex(i => i.id === req.params.id && i.organisationId === organisationId);

    if (index === -1) {
      sendError(res, 404, 'Audit not found', 'NOT_FOUND');
      return;
    }

    items[index] = { ...items[index], ...req.body, id: items[index].id, organisationId: items[index].organisationId };
    sendSuccess(res, items[index], 'Audit updated successfully');
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
    const organisationId = (req as any).user.organisationId;
    const index = items.findIndex(i => i.id === req.params.id && i.organisationId === organisationId);

    if (index === -1) {
      sendError(res, 404, 'Audit not found', 'NOT_FOUND');
      return;
    }

    items.splice(index, 1);
    sendSuccess(res, null, 'Audit deleted successfully');
  })
);

export default router;
