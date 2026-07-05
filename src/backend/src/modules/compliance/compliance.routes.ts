import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorMiddleware';
import { AuthMiddleware } from '../../middleware/auth.middleware';

const router = Router();

let authMiddleware: AuthMiddleware;

export const initializeComplianceRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

router.use((req, res, next) => authMiddleware.verifyToken(req, res, next));

// In-memory store seeded with demo data
let items: any[] = [
  { id: '1', title: 'POPIA Data Protection', description: 'Personal Information Protection compliance requirements', regulation: 'POPIA', status: 'compliant', department: 'Legal', owner: 'Sarah Smith', dueDate: '2026-08-15', lastReviewed: '2026-05-15', nextReview: '2026-08-15', notes: '', createdAt: '2026-01-15T09:00:00Z' },
  { id: '2', title: 'King IV Governance', description: 'Corporate governance code compliance', regulation: 'King IV', status: 'compliant', department: 'Board', owner: 'Lisa Brown', dueDate: '2026-07-01', lastReviewed: '2026-04-01', nextReview: '2026-07-01', notes: '', createdAt: '2026-02-10T14:30:00Z' },
  { id: '3', title: 'FICA Compliance Program', description: 'Financial Intelligence Centre Act requirements', regulation: 'FICA', status: 'partial', department: 'Finance', owner: 'Mike Johnson', dueDate: '2026-06-15', lastReviewed: '2026-03-01', nextReview: '2026-06-15', notes: 'Pending review', createdAt: '2026-01-20T11:00:00Z' },
  { id: '4', title: 'GDPR Data Privacy', description: 'General Data Protection Regulation compliance', regulation: 'GDPR', status: 'non_compliant', department: 'IT', owner: 'IT Security', dueDate: '2026-05-15', lastReviewed: '2026-02-01', nextReview: '2026-05-15', notes: 'Requires immediate action', createdAt: '2026-01-05T08:00:00Z' },
];
let nextId = 5;

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ data: items });
  })
);

router.get(
  '/summary',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ data: { total: 4, compliant: 2, partial: 1, nonCompliant: 1, overallScore: 72 } });
  })
);

router.get(
  '/trends',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      data: [
        { month: 'Jan', score: 68 },
        { month: 'Feb', score: 70 },
        { month: 'Mar', score: 69 },
        { month: 'Apr', score: 72 },
      ],
    });
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const newItem = {
      id: `comp_${nextId++}`,
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
      res.status(404).json({ message: 'Compliance item not found' });
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
      res.status(404).json({ message: 'Compliance item not found' });
      return;
    }
    items.splice(index, 1);
    res.json({ message: 'Compliance item deleted successfully' });
  })
);

export default router;
