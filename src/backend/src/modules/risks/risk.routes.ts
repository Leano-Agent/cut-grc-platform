import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess } from '../../middleware/errorMiddleware';

const router = Router();

// Initialize middleware
let authMiddleware: AuthMiddleware;

export const initializeRiskRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

// In-memory store seeded with demo data
let risks: any[] = [
  {
    id: 'risk_1',
    title: 'Data Security Breach',
    description: 'Potential unauthorized access to municipal data',
    category: 'security',
    severity: 'high',
    likelihood: 'medium',
    impact: 'high',
    status: 'open',
    department: 'IT',
    assignedTo: 'user_1',
    owner: 'IT Manager',
    mitigation: 'Implement multi-factor authentication and regular security audits',
    dueDate: '2024-02-28',
    lastUpdated: '2024-01-15T09:00:00Z',
    createdAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 'risk_2',
    title: 'Budget Overrun',
    description: 'Infrastructure project exceeding allocated budget',
    category: 'financial',
    severity: 'medium',
    likelihood: 'high',
    impact: 'high',
    status: 'in_progress',
    department: 'Finance',
    assignedTo: 'user_2',
    owner: 'Finance Director',
    mitigation: 'Monthly budget reviews and cost control measures',
    dueDate: '2024-03-15',
    lastUpdated: '2024-01-10T14:30:00Z',
    createdAt: '2024-01-10T14:30:00Z',
  },
];

let nextId = 3;

const authGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

/**
 * @route   GET /api/v1/risks
 * @desc    Get all risks
 * @access  Private
 */
router.get(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, risks, 'Risks retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/risks/:id
 * @desc    Get risk by ID
 * @access  Private
 */
router.get(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const risk = risks.find(r => r.id === req.params.id);
    if (!risk) {
      res.status(404).json({ message: 'Risk not found' });
      return;
    }
    sendSuccess(res, risk, 'Risk retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/risks
 * @desc    Create a new risk
 * @access  Private
 */
router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const newRisk = {
      id: `risk_${nextId++}`,
      ...req.body,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    risks.unshift(newRisk);
    res.status(201).json({ data: newRisk });
  })
);

/**
 * @route   PUT /api/v1/risks/:id
 * @desc    Update a risk
 * @access  Private
 */
router.put(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const index = risks.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: 'Risk not found' });
      return;
    }
    risks[index] = {
      ...risks[index],
      ...req.body,
      id: risks[index].id,
      createdAt: risks[index].createdAt,
      lastUpdated: new Date().toISOString(),
    };
    res.json({ data: risks[index] });
  })
);

/**
 * @route   DELETE /api/v1/risks/:id
 * @desc    Delete a risk
 * @access  Private
 */
router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const index = risks.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: 'Risk not found' });
      return;
    }
    risks.splice(index, 1);
    res.json({ message: 'Risk deleted successfully' });
  })
);

export default router;
