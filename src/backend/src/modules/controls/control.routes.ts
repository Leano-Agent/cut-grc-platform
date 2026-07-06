import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorMiddleware';
import { AuthMiddleware } from '../../middleware/auth.middleware';

const router = Router();

let authMiddleware: AuthMiddleware;

export const initializeControlRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

router.use((req, res, next) => authMiddleware.verifyToken(req, res, next));

// In-memory store seeded with demo data
let items: any[] = [
  { id: '1', name: 'Access Control Policy', type: 'preventive', category: 'security', status: 'active', effectiveness: 'high', owner: 'IT Security', lastReviewed: '2026-05-01', nextReview: '2026-11-01', createdAt: '2026-01-10T09:00:00Z' },
  { id: '2', name: 'Segregation of Duties', type: 'detective', category: 'financial', status: 'active', effectiveness: 'high', owner: 'Finance', lastReviewed: '2026-04-15', nextReview: '2026-10-15', createdAt: '2026-01-15T14:30:00Z' },
  { id: '3', name: 'Quarterly Risk Assessment', type: 'detective', category: 'operational', status: 'active', effectiveness: 'medium', owner: 'Risk Management', lastReviewed: '2026-03-01', nextReview: '2026-06-01', createdAt: '2026-02-01T11:00:00Z' },
  { id: '4', name: 'Incident Response Plan', type: 'corrective', category: 'security', status: 'inactive', effectiveness: 'low', owner: 'IT Security', lastReviewed: '2026-01-01', nextReview: '2026-07-01', createdAt: '2026-01-05T08:00:00Z' },
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
    res.json({ data: { total: 4, active: 3, inactive: 1, highEffectiveness: 2, mediumEffectiveness: 1, lowEffectiveness: 1 } });
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const newItem = {
      id: `ctrl_${nextId++}`,
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
      res.status(404).json({ message: 'Control not found' });
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
      res.status(404).json({ message: 'Control not found' });
      return;
    }
    items.splice(index, 1);
    res.json({ message: 'Control deleted successfully' });
  })
);

export default router;
