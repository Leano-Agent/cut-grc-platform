import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorMiddleware';
import { AuthMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const authMiddleware = new AuthMiddleware();

router.use((req, res, next) => authMiddleware.verifyToken(req, res, next));

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      data: [
        { id: '1', regulation: 'POPIA', status: 'compliant', score: 95, lastReviewed: '2026-05-15', nextReview: '2026-08-15' },
        { id: '2', regulation: 'King IV', status: 'compliant', score: 88, lastReviewed: '2026-04-01', nextReview: '2026-07-01' },
        { id: '3', regulation: 'FICA', status: 'partial', score: 65, lastReviewed: '2026-03-01', nextReview: '2026-06-15' },
        { id: '4', regulation: 'GDPR', status: 'non_compliant', score: 40, lastReviewed: '2026-02-01', nextReview: '2026-05-15' },
      ],
    });
  })
);

router.get(
  '/summary',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      data: { total: 4, compliant: 2, partial: 1, nonCompliant: 1, overallScore: 72 },
    });
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
        { month: 'May', score: 71 },
        { month: 'Jun', score: 72 },
      ],
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
