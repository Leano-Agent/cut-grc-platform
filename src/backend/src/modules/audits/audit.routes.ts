import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorMiddleware';
import { AuthMiddleware } from '../../middleware/auth.middleware';

const router = Router();

let authMiddleware: AuthMiddleware;

export const initializeAuditRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

router.use((req, res, next) => authMiddleware.verifyToken(req, res, next));

// In-memory store seeded with demo data
let items: any[] = [
  { id: '1', title: 'Financial Audit Q2', type: 'financial', status: 'in_progress', priority: 'high', scope: 'Financial statements and controls', department: 'Finance', auditor: 'Audit Team A', auditee: 'Finance Dept', scheduledStart: '2026-05-01', scheduledEnd: '2026-06-30', findings: 12, recommendations: 8, dueDate: '2026-06-30', createdAt: '2026-05-01T09:00:00Z' },
  { id: '2', title: 'IT Security Audit', type: 'external', status: 'completed', priority: 'high', scope: 'Network security and access controls', department: 'IT', auditor: 'External Auditor', auditee: 'IT Dept', scheduledStart: '2026-04-01', scheduledEnd: '2026-05-15', findings: 7, recommendations: 5, dueDate: '2026-05-15', createdAt: '2026-04-01T14:00:00Z' },
  { id: '3', title: 'Compliance Review', type: 'compliance', status: 'planned', priority: 'medium', scope: 'Regulatory compliance assessment', department: 'Compliance', auditor: 'Compliance Dept', auditee: 'All Departments', scheduledStart: '2026-07-01', scheduledEnd: '2026-08-01', findings: 0, recommendations: 0, dueDate: '2026-08-01', createdAt: '2026-06-01T11:00:00Z' },
];
let nextId = 4;

router.get(
  '/summary',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ data: { total: 3, completed: 1, inProgress: 1, planned: 1, overdue: 0 } });
  })
);

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ data: items });
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const newItem = {
      id: `audit_${nextId++}`,
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    res.status(201).json({ data: newItem });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const index = items.findIndex(i => i.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: 'Audit not found' });
      return;
    }
    items[index] = { ...items[index], ...req.body, id: items[index].id };
    res.json({ data: items[index] });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const index = items.findIndex(i => i.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: 'Audit not found' });
      return;
    }
    items.splice(index, 1);
    res.json({ message: 'Audit deleted successfully' });
  })
);

export default router;
