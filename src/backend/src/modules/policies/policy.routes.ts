import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess } from '../../middleware/errorMiddleware';

const router = Router();

// Initialize middleware
let authMiddleware: AuthMiddleware;

export const initializePolicyRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

// ─── In-memory store ──────────────────────────────────────────────────────────
let policies: any[] = [
  {
    id: 'policy_1',
    title: 'Information Security Policy',
    description: 'Enterprise-wide information security framework governing data protection, access control, and incident response for all municipal systems.',
    category: 'information_security',
    status: 'published',
    version: '2.1.0',
    content: '## 1. Purpose\n\nThis policy establishes the information security framework for the organisation.\n\n## 2. Scope\n\nApplies to all employees, contractors, and third-party vendors.\n\n## 3. Policy\n\n### 3.1 Access Control\n- All systems require multi-factor authentication\n- Access is granted on a least-privilege basis\n- Quarterly access reviews are mandatory\n\n### 3.2 Data Classification\n- Public: No restrictions\n- Internal: Authorised personnel only\n- Confidential: Role-based access required\n- Restricted: Need-to-know basis, encryption required\n\n### 3.3 Incident Response\n- All security incidents must be reported within 1 hour\n- Critical incidents require immediate escalation to CISO\n- Post-incident reviews must be completed within 5 business days',
    scope: 'All departments and subsidiaries',
    department: 'IT',
    ownerId: 'user_1',
    approverId: 'user_2',
    effectiveDate: '2026-01-01',
    reviewDate: '2026-07-01',
    expiryDate: '2027-01-01',
    tags: ['security', 'data-protection', 'access-control', 'compliance'],
    attachments: [],
    regulatoryReferences: ['POPIA', 'GDPR', 'ISO 27001'],
    metadata: {},
    lastUpdated: '2026-06-15T10:00:00Z',
    createdAt: '2025-12-01T08:00:00Z',
  },
  {
    id: 'policy_2',
    title: 'Data Privacy & Protection Policy',
    description: 'Framework for handling personal information in compliance with POPIA and applicable privacy regulations.',
    category: 'data_privacy',
    status: 'published',
    version: '1.3.0',
    content: '## 1. Purpose\n\nTo ensure compliance with POPIA and protect personal information.\n\n## 2. Scope\n\nAll processing of personal information by the organisation.\n\n## 3. Policy\n\n### 3.1 Data Collection\n- Collect only necessary personal information\n- Obtain explicit consent where required\n- Provide privacy notices at point of collection',
    scope: 'All departments',
    department: 'Legal',
    ownerId: 'user_2',
    approverId: 'user_1',
    effectiveDate: '2026-02-01',
    reviewDate: '2026-08-01',
    expiryDate: '2027-02-01',
    tags: ['privacy', 'popia', 'data-protection', 'compliance'],
    attachments: [],
    regulatoryReferences: ['POPIA'],
    metadata: {},
    lastUpdated: '2026-05-20T14:30:00Z',
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'policy_3',
    title: 'Acceptable Use Policy',
    description: 'Guidelines for the acceptable use of organisational IT resources and communication systems.',
    category: 'acceptable_use',
    status: 'under_review',
    version: '3.0.0',
    content: '## 1. Purpose\n\nTo define acceptable use of organisational IT resources.\n\n## 2. Scope\n\nAll users of organisational IT resources.\n\n## 3. Policy\n\n### 3.1 Personal Use\n- Incidental personal use is permitted\n- Must not interfere with work duties\n- No excessive bandwidth consumption',
    scope: 'All employees and contractors',
    department: 'HR',
    ownerId: 'user_1',
    approverId: null,
    effectiveDate: '2026-07-01',
    reviewDate: '2026-12-01',
    expiryDate: '2027-07-01',
    tags: ['acceptable-use', 'it-resources'],
    attachments: [],
    regulatoryReferences: [],
    metadata: {},
    lastUpdated: '2026-06-20T11:00:00Z',
    createdAt: '2026-03-01T10:00:00Z',
  },
];

let nextId = 4;

const authGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

// ─── Helper: filter policies ──────────────────────────────────────────────────
const filterPolicies = (query: any) => {
  let result = [...policies];

  if (query.category) {
    result = result.filter(p => p.category === query.category);
  }
  if (query.status) {
    result = result.filter(p => p.status === query.status);
  }
  if (query.department) {
    result = result.filter(p => p.department?.toLowerCase() === query.department.toLowerCase());
  }
  if (query.search) {
    const s = query.search.toLowerCase();
    result = result.filter(p =>
      p.title.toLowerCase().includes(s) ||
      p.description?.toLowerCase().includes(s) ||
      p.tags?.some((t: string) => t.toLowerCase().includes(s))
    );
  }
  if (query.ownerId) {
    result = result.filter(p => p.ownerId === query.ownerId);
  }

  return result;
};

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/v1/policies
 * @desc    Get all policies with optional filtering
 * @access  Private
 */
router.get(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const filtered = filterPolicies(req.query);
    sendSuccess(res, filtered, 'Policies retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/policies/:id
 * @desc    Get policy by ID
 * @access  Private
 */
router.get(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const policy = policies.find(p => p.id === req.params.id);
    if (!policy) {
      res.status(404).json({ message: 'Policy not found' });
      return;
    }
    sendSuccess(res, policy, 'Policy retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/policies
 * @desc    Create a new policy
 * @access  Private (admin, manager)
 */
router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const { title, description, category, content, scope, department, ownerId, approverId, effectiveDate, reviewDate, expiryDate, tags, regulatoryReferences } = req.body;

    if (!title || title.trim().length === 0) {
      res.status(400).json({ message: 'Policy title is required' });
      return;
    }

    const now = new Date().toISOString();
    const newPolicy = {
      id: `policy_${nextId++}`,
      title: title.trim(),
      description: description || null,
      category: category || 'other',
      status: 'draft',
      version: '1.0.0',
      content: content || null,
      scope: scope || null,
      department: department || null,
      ownerId: ownerId || null,
      approverId: approverId || null,
      effectiveDate: effectiveDate || null,
      reviewDate: reviewDate || null,
      expiryDate: expiryDate || null,
      tags: tags || [],
      attachments: [],
      regulatoryReferences: regulatoryReferences || [],
      metadata: {},
      lastUpdated: now,
      createdAt: now,
    };

    policies.unshift(newPolicy);
    res.status(201).json({ data: newPolicy });
  })
);

/**
 * @route   PUT /api/v1/policies/:id
 * @desc    Update a policy
 * @access  Private (admin, manager)
 */
router.put(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const index = policies.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: 'Policy not found' });
      return;
    }

    const allowedFields = [
      'title', 'description', 'category', 'status', 'content', 'scope',
      'department', 'ownerId', 'approverId', 'effectiveDate', 'reviewDate',
      'expiryDate', 'tags', 'regulatoryReferences'
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Version bump for significant changes
    if (updates.content || updates.title) {
      const currentVersion = policies[index].version;
      const parts = currentVersion.split('.').map(Number);
      updates.version = `${parts[0]}.${parts[1] + 1}.0`;
    }

    policies[index] = {
      ...policies[index],
      ...updates,
      id: policies[index].id,
      createdAt: policies[index].createdAt,
      lastUpdated: new Date().toISOString(),
    };

    res.json({ data: policies[index] });
  })
);

/**
 * @route   PATCH /api/v1/policies/:id/status
 * @desc    Update policy workflow status (approve, publish, archive, etc.)
 * @access  Private (admin)
 */
router.patch(
  '/:id/status',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const policy = policies.find(p => p.id === req.params.id);
    if (!policy) {
      res.status(404).json({ message: 'Policy not found' });
      return;
    }

    const validTransitions: Record<string, string[]> = {
      draft: ['under_review', 'archived'],
      under_review: ['approved', 'draft', 'archived'],
      approved: ['published', 'draft', 'archived'],
      published: ['expired', 'archived'],
      expired: ['draft', 'archived'],
      archived: ['draft'],
    };

    const newStatus = req.body.status;
    const allowed = validTransitions[policy.status] || [];

    if (!allowed.includes(newStatus)) {
      res.status(400).json({
        message: `Cannot transition from '${policy.status}' to '${newStatus}'. Allowed: ${allowed.join(', ')}`,
      });
      return;
    }

    policy.status = newStatus;
    policy.lastUpdated = new Date().toISOString();

    res.json({ data: policy });
  })
);

/**
 * @route   DELETE /api/v1/policies/:id
 * @desc    Delete a policy (soft: archives it)
 * @access  Private (admin)
 */
router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const index = policies.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: 'Policy not found' });
      return;
    }
    // Soft delete — archive instead
    policies[index].status = 'archived';
    policies[index].lastUpdated = new Date().toISOString();
    res.json({ message: 'Policy archived successfully' });
  })
);

/**
 * @route   GET /api/v1/policies/stats/summary
 * @desc    Get policy statistics
 * @access  Private
 */
router.get(
  '/stats/summary',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const total = policies.length;
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const p of policies) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    }

    sendSuccess(res, {
      total,
      byStatus,
      byCategory,
      expiringSoon: policies.filter(p => {
        if (!p.expiryDate) return false;
        const daysToExpiry = (new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysToExpiry > 0 && daysToExpiry <= 90;
      }).length,
      needsReview: policies.filter(p => {
        if (!p.reviewDate) return false;
        return new Date(p.reviewDate) <= new Date();
      }).length,
    }, 'Policy statistics retrieved successfully');
  })
);

export default router;
