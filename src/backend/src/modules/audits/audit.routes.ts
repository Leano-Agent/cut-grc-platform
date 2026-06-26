import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorMiddleware';
import { AuthMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Initialize middleware
let authMiddleware: AuthMiddleware;

export const initializeAuditRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

// All routes require auth
router.use((req, res, next) => authMiddleware.verifyToken(req, res, next));

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      data: [
        { id: '1', title: 'Q2 Financial Audit', status: 'in_progress', priority: 'high', assignee: 'Audit Team', dueDate: '2026-07-15', createdAt: '2026-05-01' },
        { id: '2', title: 'IT Security Audit', status: 'completed', priority: 'critical', assignee: 'Security Team', dueDate: '2026-06-01', createdAt: '2026-04-15' },
        { id: '3', title: 'Compliance Review', status: 'planned', priority: 'medium', assignee: 'Compliance Dept', dueDate: '2026-08-01', createdAt: '2026-06-01' },
      ],
    });
  })
);

router.get(
  '/summary',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      data: { total: 3, completed: 1, inProgress: 1, planned: 1, overdue: 0 },
    });
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json({ data: { id: 'new', ...req.body, createdAt: new Date().toISOString() } });
  })
);

export default router;
