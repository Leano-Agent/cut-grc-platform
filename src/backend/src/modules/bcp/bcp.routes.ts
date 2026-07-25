import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess } from '../../middleware/errorMiddleware';

const router = Router();

let authMiddleware: AuthMiddleware;

export const initializeBcpRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

// ─── In-memory store ──────────────────────────────────────────────────────────
let bcpPlans: any[] = [
  {
    id: 'bcp_1',
    name: 'IT Disaster Recovery Plan',
    description: 'Comprehensive IT disaster recovery plan covering critical infrastructure, data centres, and core business applications. Ensures IT service continuity within defined RTO/RPO thresholds.',
    type: 'drp',
    status: 'approved',
    department: 'IT',
    owner: 'Thabo Nkosi',
    scope: 'All IT infrastructure, data centres, cloud services, and enterprise applications across the municipality.',
    objectives: 'Restore critical IT services within 4 hours of a disaster event. Maintain data integrity with maximum 1-hour data loss. Ensure business continuity for all digital services.',
    criticalFunctions: [
      { name: 'Network Infrastructure', rto: 2, rpo: 0.5, priority: 1 },
      { name: 'Email & Communication', rto: 1, rpo: 0.25, priority: 1 },
      { name: 'Financial Systems', rto: 4, rpo: 1, priority: 2 },
      { name: 'HR Systems', rto: 8, rpo: 2, priority: 3 },
    ],
    recoveryProcedures: [
      { step: 1, description: 'Activate incident response team and declare disaster', owner: 'IT Director', duration: '15 min' },
      { step: 2, description: 'Failover to secondary data centre', owner: 'Infrastructure Lead', duration: '30 min' },
      { step: 3, description: 'Restore core network services', owner: 'Network Team', duration: '45 min' },
      { step: 4, description: 'Restore critical application servers', owner: 'Systems Team', duration: '60 min' },
      { step: 5, description: 'Verify data integrity and resume operations', owner: 'IT Director', duration: '30 min' },
    ],
    testSchedule: {
      frequency: 'quarterly',
      lastTestDate: '2026-04-15T10:00:00Z',
      nextTestDate: '2026-07-15T10:00:00Z',
      lastTestResult: 'pass',
    },
    testHistory: [
      { date: '2026-04-15T10:00:00Z', type: 'full_failover', result: 'pass', notes: 'Full failover completed in 3h 45min. All critical systems restored within RTO.', participants: 'IT Team, External Audit' },
      { date: '2026-01-20T10:00:00Z', type: 'tabletop', result: 'pass_with_issues', notes: 'Communication protocol gaps identified. Updated contact lists and escalation procedures.', participants: 'IT Management, Department Heads' },
    ],
    stakeholders: [
      { name: 'Thabo Nkosi', role: 'IT Director', contact: 'thabo.nkosi@ngome.gov.za', department: 'IT' },
      { name: 'John Molefe', role: 'Security Lead', contact: 'john.molefe@ngome.gov.za', department: 'Security' },
      { name: 'Lindiwe Zulu', role: 'CFO', contact: 'lindiwe.zulu@ngome.gov.za', department: 'Finance' },
    ],
    relatedIncidents: ['inc_1', 'inc_3'],
    tags: ['it-disaster-recovery', 'infrastructure', 'data-centre', 'failover'],
    createdAt: '2025-11-01T08:00:00Z',
    updatedAt: '2026-04-15T14:00:00Z',
  },
  {
    id: 'bcp_2',
    name: 'Business Continuity Plan',
    description: 'Organisation-wide business continuity framework ensuring critical municipal services continue during major disruptions including natural disasters, pandemics, and civil unrest.',
    type: 'bcp',
    status: 'reviewed',
    department: 'All Departments',
    owner: 'Lindiwe Zulu',
    scope: 'All municipal departments, critical services, public-facing operations, and essential infrastructure.',
    objectives: 'Maintain essential municipal services within 24 hours of disruption. Limit data loss to maximum 4 hours. Protect public safety and critical infrastructure.',
    criticalFunctions: [
      { name: 'Emergency Services Dispatch', rto: 1, rpo: 0.25, priority: 1 },
      { name: 'Water & Sanitation', rto: 4, rpo: 1, priority: 1 },
      { name: 'Revenue Collection', rto: 24, rpo: 4, priority: 2 },
      { name: 'Public Records Access', rto: 8, rpo: 2, priority: 2 },
      { name: 'HR & Payroll', rto: 48, rpo: 8, priority: 3 },
    ],
    recoveryProcedures: [
      { step: 1, description: 'Activate Business Continuity Command Centre', owner: 'Municipal Manager', duration: '30 min' },
      { step: 2, description: 'Assess impact and declare business continuity event', owner: 'BCP Lead', duration: '30 min' },
      { step: 3, description: 'Establish remote work infrastructure', owner: 'IT Director', duration: '2 hours' },
      { step: 4, description: 'Prioritise and restore critical services', owner: 'Department Heads', duration: '4 hours' },
      { step: 5, description: 'Communicate with public and stakeholders', owner: 'Communications Lead', duration: '1 hour' },
    ],
    testSchedule: {
      frequency: 'biannual',
      lastTestDate: '2026-03-20T09:00:00Z',
      nextTestDate: '2026-09-20T09:00:00Z',
      lastTestResult: 'pass_with_issues',
    },
    testHistory: [
      { date: '2026-03-20T09:00:00Z', type: 'exercise', result: 'pass_with_issues', notes: 'Remote work activation successful but VPN capacity insufficient for full department load. Upgrade planned.', participants: 'All Departments, IT, Facilities' },
    ],
    stakeholders: [
      { name: 'Lindiwe Zulu', role: 'CFO / BCP Lead', contact: 'lindiwe.zulu@ngome.gov.za', department: 'Finance' },
      { name: 'Thabo Nkosi', role: 'IT Director', contact: 'thabo.nkosi@ngome.gov.za', department: 'IT' },
      { name: 'Sarah Mthembu', role: 'Municipal Manager', contact: 'sarah.mthembu@ngome.gov.za', department: 'Executive' },
    ],
    relatedIncidents: [],
    tags: ['business-continuity', 'organisation-wide', 'pandemic', 'natural-disaster'],
    createdAt: '2025-06-15T10:00:00Z',
    updatedAt: '2026-03-20T11:00:00Z',
  },
];

let nextId = 3;

const authGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

// ─── Helper: filter BCP plans ─────────────────────────────────────────────────
const filterPlans = (query: any) => {
  let result = [...bcpPlans];

  if (query.type) result = result.filter(p => p.type === query.type);
  if (query.status) result = result.filter(p => p.status === query.status);
  if (query.department) result = result.filter(p => p.department?.toLowerCase() === query.department.toLowerCase());
  if (query.search) {
    const s = query.search.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(s) ||
      p.description?.toLowerCase().includes(s) ||
      p.tags?.some((t: string) => t.toLowerCase().includes(s)) ||
      p.owner?.toLowerCase().includes(s)
    );
  }
  return result;
};

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/v1/bcp
 * @desc    Get all BCP plans with filtering
 */
router.get(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const filtered = filterPlans(req.query);
    sendSuccess(res, filtered, 'BCP plans retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/bcp/stats/summary
 * @desc    BCP plan statistics
 */
router.get(
  '/stats/summary',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const total = bcpPlans.length;
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let testedCount = 0;
    const now = new Date();
    let expiringSoon = 0;

    for (const p of bcpPlans) {
      byType[p.type] = (byType[p.type] || 0) + 1;
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      if (p.testHistory && p.testHistory.length > 0) testedCount++;
      if (p.testSchedule?.nextTestDate) {
        const next = new Date(p.testSchedule.nextTestDate);
        const daysUntil = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil >= 0 && daysUntil <= 30) expiringSoon++;
      }
    }

    sendSuccess(res, {
      total,
      byType,
      byStatus,
      testedCount,
      expiringSoon,
      approved: bcpPlans.filter(p => p.status === 'approved').length,
      needsReview: bcpPlans.filter(p => p.status === 'reviewed').length,
      draft: bcpPlans.filter(p => p.status === 'draft').length,
    }, 'BCP statistics retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/bcp/:id
 * @desc    Get BCP plan by ID
 */
router.get(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const plan = bcpPlans.find(p => p.id === req.params.id);
    if (!plan) {
      res.status(404).json({ message: 'BCP plan not found' });
      return;
    }
    sendSuccess(res, plan, 'BCP plan retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/bcp
 * @desc    Create a new BCP plan
 */
router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, type, department, owner, scope, objectives, criticalFunctions, recoveryProcedures, stakeholders, tags } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).json({ message: 'BCP plan name is required' });
      return;
    }

    const now = new Date().toISOString();
    const newPlan = {
      id: `bcp_${nextId++}`,
      name: name.trim(),
      description: description || null,
      type: type || 'bcp',
      status: 'draft',
      department: department || null,
      owner: owner || null,
      scope: scope || null,
      objectives: objectives || null,
      criticalFunctions: criticalFunctions || [],
      recoveryProcedures: recoveryProcedures || [],
      testSchedule: {
        frequency: 'annual',
        lastTestDate: null,
        nextTestDate: null,
        lastTestResult: null,
      },
      testHistory: [],
      stakeholders: stakeholders || [],
      relatedIncidents: [],
      tags: tags || [],
      createdAt: now,
      updatedAt: now,
    };

    bcpPlans.unshift(newPlan);
    res.status(201).json({ data: newPlan });
  })
);

/**
 * @route   PUT /api/v1/bcp/:id
 * @desc    Update a BCP plan
 */
router.put(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const index = bcpPlans.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: 'BCP plan not found' });
      return;
    }

    const allowedFields = [
      'name', 'description', 'type', 'department', 'owner',
      'scope', 'objectives', 'criticalFunctions', 'recoveryProcedures',
      'testSchedule', 'stakeholders', 'tags', 'relatedIncidents',
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    bcpPlans[index] = {
      ...bcpPlans[index],
      ...updates,
      id: bcpPlans[index].id,
      createdAt: bcpPlans[index].createdAt,
      updatedAt: new Date().toISOString(),
    };

    res.json({ data: bcpPlans[index] });
  })
);

/**
 * @route   PATCH /api/v1/bcp/:id/status
 * @desc    Update BCP plan status workflow
 */
router.patch(
  '/:id/status',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const plan = bcpPlans.find(p => p.id === req.params.id);
    if (!plan) {
      res.status(404).json({ message: 'BCP plan not found' });
      return;
    }

    const validTransitions: Record<string, string[]> = {
      draft: ['reviewed'],
      reviewed: ['approved', 'draft'],
      approved: ['tested', 'reviewed'],
      tested: ['approved', 'expired'],
      expired: ['draft'],
    };

    const newStatus = req.body.status;
    const allowed = validTransitions[plan.status] || [];

    if (!allowed.includes(newStatus)) {
      res.status(400).json({
        message: `Cannot transition from '${plan.status}' to '${newStatus}'. Allowed: ${allowed.join(', ')}`,
      });
      return;
    }

    plan.status = newStatus;
    plan.updatedAt = new Date().toISOString();

    res.json({ data: plan });
  })
);

/**
 * @route   POST /api/v1/bcp/:id/test
 * @desc    Record a test result for a BCP plan
 */
router.post(
  '/:id/test',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const plan = bcpPlans.find(p => p.id === req.params.id);
    if (!plan) {
      res.status(404).json({ message: 'BCP plan not found' });
      return;
    }

    const { type, result, notes, participants } = req.body;
    if (!type || !result) {
      res.status(400).json({ message: 'Test type and result are required' });
      return;
    }

    const now = new Date().toISOString();
    const testRecord = {
      date: now,
      type,
      result,
      notes: notes || null,
      participants: participants || [],
    };

    // Set next test date based on frequency
    const freqMonths: Record<string, number> = {
      monthly: 1, quarterly: 3, biannual: 6, annual: 12,
    };
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + (freqMonths[plan.testSchedule.frequency] || 12));

    plan.testHistory.push(testRecord);
    plan.testSchedule.lastTestDate = now;
    plan.testSchedule.nextTestDate = nextDate.toISOString();
    plan.testSchedule.lastTestResult = result;
    plan.updatedAt = now;

    res.status(201).json({ data: plan });
  })
);

/**
 * @route   DELETE /api/v1/bcp/:id
 * @desc    Archive (delete) a BCP plan
 */
router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const index = bcpPlans.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: 'BCP plan not found' });
      return;
    }
    const [plan] = bcpPlans.splice(index, 1);
    res.json({ message: 'BCP plan archived successfully', data: plan });
  })
);

export default router;
