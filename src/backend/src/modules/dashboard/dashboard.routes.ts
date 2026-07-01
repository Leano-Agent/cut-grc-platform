import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorMiddleware';
import { AuthMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Initialize middleware
let authMiddleware: AuthMiddleware;

export const initializeDashboardRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

/**
 * Dashboard routes — aggregated data for the main dashboard
 * These return sample data until the full GRC data layer is built.
 */
router.get(
  '/stats',
  (req, res, next) => authMiddleware.verifyToken(req, res, next),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      totalRisks: 24,
      riskChange: '+3',
      complianceRate: 87,
      complianceChange: '+5',
      openAudits: 3,
      auditChange: '0',
      activeUsers: 5,
      userChange: '+2',
    });
  })
);

router.get(
  '/risk-trends',
  (req, res, next) => authMiddleware.verifyToken(req, res, next),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json([
      { month: 'Jan', high: 5, medium: 8, low: 12 },
      { month: 'Feb', high: 4, medium: 9, low: 11 },
      { month: 'Mar', high: 3, medium: 7, low: 14 },
      { month: 'Apr', high: 2, medium: 6, low: 16 },
      { month: 'May', high: 3, medium: 5, low: 13 },
      { month: 'Jun', high: 1, medium: 4, low: 15 },
    ]);
  })
);

router.get(
  '/compliance-trends',
  (req, res, next) => authMiddleware.verifyToken(req, res, next),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json([
      { quarter: 'Q1 2026', score: 78 },
      { quarter: 'Q2 2026', score: 82 },
      { quarter: 'Q3 2026', score: 87 },
    ]);
  })
);

router.get(
  '/audit-status',
  (req, res, next) => authMiddleware.verifyToken(req, res, next),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json([
      { name: 'Completed', value: 12 },
      { name: 'In Progress', value: 3 },
      { name: 'Planned', value: 5 },
      { name: 'Overdue', value: 1 },
    ]);
  })
);

router.get(
  '/activities',
  (req, res, next) => authMiddleware.verifyToken(req, res, next),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      data: [
        { id: '1', action: 'Risk #1042 updated', user: 'Oratile Admin', module: 'Risk Management', time: '10 minutes ago', avatar: 'OA' },
        { id: '2', action: 'Compliance review completed', user: 'Oratile Admin', module: 'Compliance Tracking', time: '1 hour ago', avatar: 'OA' },
        { id: '3', action: 'Audit #3012 scheduled', user: 'Oratile Admin', module: 'Audit Management', time: '3 hours ago', avatar: 'OA' },
        { id: '4', action: 'New control added', user: 'Oratile Admin', module: 'Internal Controls', time: 'Yesterday', avatar: 'OA' },
        { id: '5', action: 'Policy document updated', user: 'Oratile Admin', module: 'Document Management', time: 'Yesterday', avatar: 'OA' },
      ],
    });
  })
);

export default router;
