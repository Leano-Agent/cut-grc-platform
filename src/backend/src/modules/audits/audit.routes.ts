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
  { id: '1', title: 'Financial Audit Q2', status: 'in_progress', priority: 'high', assignee: 'Audit Team A', dueDate: '2026-06-30', createdAt: '2026-05-01T09:00:00Z', scope: 'Financial statements and controls' },
  { id: '2', title: 'IT Security Audit', status: 'completed', priority: 'high', assignee: 'External Auditor', dueDate: '2026-05-15', createdAt: '2026-04-01T14:00:00Z', scope: 'Network security and access controls' },
  { id: '3', title: 'Compliance Review', status: 'planned', priority: 'medium', assignee: 'Compliance Dept', dueDate: '2026-08-01', createdAt: '2026-06-01T11:00:00Z', scope: 'Regulatory compliance assessment' },
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
