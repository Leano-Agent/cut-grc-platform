import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorMiddleware';
import { AuthMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Initialize middleware
let authMiddleware: AuthMiddleware;

export const initializeControlRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

router.use((req, res, next) => authMiddleware.verifyToken(req, res, next));

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      data: [
        { id: '1', name: 'Access Control Review', category: 'IT', status: 'active', effectiveness: 'high', lastTested: '2026-05-01' },
        { id: '2', name: 'Financial Approval Process', category: 'Finance', status: 'active', effectiveness: 'medium', lastTested: '2026-04-15' },
        { id: '3', name: 'Data Backup Verification', category: 'IT', status: 'active', effectiveness: 'high', lastTested: '2026-05-20' },
        { id: '4', name: 'Vendor Due Diligence', category: 'Procurement', status: 'inactive', effectiveness: 'low', lastTested: '2026-03-01' },
      ],
    });
  })
);

router.get(
  '/summary',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      data: { total: 4, active: 3, inactive: 1, highEffectiveness: 2, mediumEffectiveness: 1, lowEffectiveness: 1 },
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
