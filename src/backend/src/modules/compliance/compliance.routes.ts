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
  { id: '1', regulation: 'POPIA', status: 'compliant', score: 95, lastReviewed: '2026-05-15', nextReview: '2026-08-15' },
  { id: '2', regulation: 'King IV', status: 'compliant', score: 88, lastReviewed: '2026-04-01', nextReview: '2026-07-01' },
  { id: '3', regulation: 'FICA', status: 'partial', score: 65, lastReviewed: '2026-03-01', nextReview: '2026-06-15' },
  { id: '4', regulation: 'GDPR', status: 'non_compliant', score: 40, lastReviewed: '2026-02-01', nextReview: '2026-05-15' },
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
