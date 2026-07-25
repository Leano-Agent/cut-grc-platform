import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess } from '../../middleware/errorMiddleware';

const router = Router();
let authMiddleware: AuthMiddleware;
export const initializeActionRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};
const authGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

let actions: any[] = [
  {
    id: 'act_1', title: 'Remediate firewall rule gaps identified in Q2 audit',
    description: 'Q2 internal audit identified 12 overly permissive firewall rules in the DMZ segment that need to be tightened to comply with the least-privilege principle.',
    source: 'audit', sourceId: 'audit_q2_2026', sourceRef: 'AUD-2026-042',
    status: 'in_progress', priority: 'critical', category: 'corrective',
    department: 'IT', assignedTo: 'user_1', dueDate: '2026-08-15', completedAt: null,
    rootCause: 'Historical configurations grandfathered without review during network migrations.',
    resolution: null, closureNotes: null, evidence: [],
    relatedActionIds: ['act_3'], tags: ['firewall', 'network-security', 'audit-finding'],
    checklist: [
      { id: 'cl_1', title: 'Audit all DMZ firewall rules', completed: true, completedAt: '2026-07-10T14:00:00Z', assignedTo: null },
      { id: 'cl_2', title: 'Identify and document overly permissive rules', completed: true, completedAt: '2026-07-12T09:00:00Z', assignedTo: null },
      { id: 'cl_3', title: 'Implement rule changes in staging', completed: false, completedAt: null, assignedTo: 'user_1' },
      { id: 'cl_4', title: 'Peer review and approval', completed: false, completedAt: null, assignedTo: 'user_2' },
      { id: 'cl_5', title: 'Deploy to production', completed: false, completedAt: null, assignedTo: 'user_1' },
    ],
    comments: [
      { id: 'cmt_1', comment: 'Firewall audit complete. Found 12 rules allowing any-any access from DMZ to internal network.', userId: 'user_1', createdAt: '2026-07-10T15:00:00Z' },
      { id: 'cmt_2', comment: 'Change request submitted for review. Moving to staging this week.', userId: 'user_1', createdAt: '2026-07-14T10:00:00Z' },
    ],
    metadata: {}, lastUpdated: '2026-07-14T10:00:00Z', createdAt: '2026-07-08T09:00:00Z',
  },
  {
    id: 'act_2', title: 'POPIA compliance training for Finance department',
    description: 'Following the employee data access violation (INC-2026-002), mandatory POPIA refresher training must be completed by all Finance staff.',
    source: 'incident', sourceId: 'inc_2', sourceRef: 'INC-2026-002',
    status: 'open', priority: 'high', category: 'corrective',
    department: 'Finance', assignedTo: 'user_2', dueDate: '2026-08-30', completedAt: null,
    rootCause: 'Insufficient awareness of POPIA data handling requirements among finance personnel.', resolution: null, closureNotes: null,
    evidence: [], relatedActionIds: [], tags: ['popia', 'training', 'data-privacy'],
    checklist: [
      { id: 'cl_6', title: 'Develop training material', completed: false, completedAt: null, assignedTo: 'user_2' },
      { id: 'cl_7', title: 'Schedule training sessions', completed: false, completedAt: null, assignedTo: 'user_2' },
      { id: 'cl_8', title: 'Track completion and certification', completed: false, completedAt: null, assignedTo: null },
    ],
    comments: [], metadata: {}, lastUpdated: '2026-07-20T08:00:00Z', createdAt: '2026-07-20T08:00:00Z',
  },
  {
    id: 'act_3', title: 'Implement automated security alerting for critical systems',
    description: 'Preventive measure to ensure real-time alerting on all critical systems following the network intrusion incident. Recommended by post-incident review.',
    source: 'incident', sourceId: 'inc_1', sourceRef: 'INC-2026-001',
    status: 'open', priority: 'high', category: 'preventive',
    department: 'IT', assignedTo: 'user_1', dueDate: '2026-09-15', completedAt: null,
    rootCause: 'Manual monitoring only — no automated alerting on anomalous network patterns.', resolution: null, closureNotes: null,
    evidence: [], relatedActionIds: ['act_1'], tags: ['monitoring', 'alerting', 'security'],
    checklist: [], comments: [], metadata: {}, lastUpdated: '2026-07-19T11:00:00Z', createdAt: '2026-07-19T11:00:00Z',
  },
  {
    id: 'act_4', title: 'Update Incident Response Playbook',
    description: 'Improvement action from lessons learned — update the IR playbook to include specific procedures for phishing and social engineering attacks.',
    source: 'incident', sourceId: 'inc_3', sourceRef: 'INC-2026-003',
    status: 'closed', priority: 'medium', category: 'improvement',
    department: 'IT', assignedTo: 'user_1', dueDate: '2026-07-01', completedAt: '2026-06-28T16:00:00Z',
    rootCause: 'Phishing playbook section was incomplete — lacked finance-specific escalation path.',
    resolution: 'IR playbook v2.3 published and distributed to all IT staff. Finance-specific escalation path added.',
    closureNotes: 'Reviewed and approved by CISO. Playbook change communicated in all-hands meeting.',
    evidence: ['IR_Playbook_v2.3.pdf'], relatedActionIds: [], tags: ['incident-response', 'playbook'],
    checklist: [
      { id: 'cl_9', title: 'Draft playbook updates', completed: true, completedAt: '2026-06-20T12:00:00Z', assignedTo: null },
      { id: 'cl_10', title: 'Peer review', completed: true, completedAt: '2026-06-25T14:00:00Z', assignedTo: null },
      { id: 'cl_11', title: 'CISO approval', completed: true, completedAt: '2026-06-27T10:00:00Z', assignedTo: null },
      { id: 'cl_12', title: 'Publish and communicate', completed: true, completedAt: '2026-06-28T16:00:00Z', assignedTo: null },
    ],
    comments: [
      { id: 'cmt_3', comment: 'Draft complete. Adding finance-specific flow for payment requests.', userId: 'user_1', createdAt: '2026-06-20T13:00:00Z' },
      { id: 'cmt_4', comment: 'Approved. Good work on the escalation matrix.', userId: 'user_2', createdAt: '2026-06-27T10:30:00Z' },
    ],
    metadata: {}, lastUpdated: '2026-06-28T16:00:00Z', createdAt: '2026-06-15T09:00:00Z',
  },
];

let nextId = 5, nextClId = 13, nextCmtId = 5;

const filterActions = (q: any) => {
  let r = [...actions];
  if (q.status) r = r.filter(a => a.status === q.status);
  if (q.priority) r = r.filter(a => a.priority === q.priority);
  if (q.source) r = r.filter(a => a.source === q.source);
  if (q.category) r = r.filter(a => a.category === q.category);
  if (q.department) r = r.filter(a => a.department?.toLowerCase() === q.department.toLowerCase());
  if (q.assignedTo) r = r.filter(a => a.assignedTo === q.assignedTo);
  if (q.overdue) r = r.filter(a => a.dueDate && new Date(a.dueDate) < new Date() && a.status !== 'closed');
  if (q.search) { const s = q.search.toLowerCase(); r = r.filter(a => a.title.toLowerCase().includes(s) || a.tags?.some((t: string) => t.includes(s))); }
  return r;
};

const computeStats = () => {
  const byStatus: Record<string, number> = {}, byPriority: Record<string, number> = {}, bySource: Record<string, number> = {};
  let overdue = 0, completed = 0;
  actions.forEach(a => {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    byPriority[a.priority] = (byPriority[a.priority] || 0) + 1;
    bySource[a.source] = (bySource[a.source] || 0) + 1;
    if (a.dueDate && new Date(a.dueDate) < new Date() && !['closed', 'rejected'].includes(a.status)) overdue++;
    if (a.status === 'closed') completed++;
  });
  return { total: actions.length, byStatus, byPriority, bySource, overdue, completed, openCount: actions.filter(a => !['closed', 'rejected'].includes(a.status)).length };
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────
router.get('/', authGuard, asyncHandler(async (req, res) => sendSuccess(res, filterActions(req.query), 'Actions retrieved')));
router.get('/stats/summary', authGuard, asyncHandler(async (req, res) => sendSuccess(res, computeStats(), 'Stats retrieved')));

router.get('/:id', authGuard, asyncHandler(async (req, res) => {
  const a = actions.find(x => x.id === req.params.id);
  if (!a) { res.status(404).json({ message: 'Action not found' }); return; }
  sendSuccess(res, a, 'Action retrieved');
}));

router.post('/', authGuard, asyncHandler(async (req, res) => {
  const { title, description, source, sourceId, sourceRef, priority, category, department, assignedTo, dueDate, tags } = req.body;
  if (!title?.trim()) { res.status(400).json({ message: 'Action title required' }); return; }
  const now = new Date().toISOString();
  const na = {
    id: `act_${nextId++}`, title: title.trim(), description: description || null,
    source: source || 'other', sourceId: sourceId || null, sourceRef: sourceRef || null,
    status: 'open', priority: priority || 'medium', category: category || 'corrective',
    department: department || null, assignedTo: assignedTo || null,
    dueDate: dueDate || null, completedAt: null,
    rootCause: null, resolution: null, closureNotes: null, evidence: [],
    relatedActionIds: [], tags: tags || [], checklist: [], comments: [],
    metadata: {}, lastUpdated: now, createdAt: now,
  };
  actions.unshift(na);
  res.status(201).json({ data: na });
}));

router.put('/:id', authGuard, asyncHandler(async (req, res) => {
  const idx = actions.findIndex(x => x.id === req.params.id);
  if (idx === -1) { res.status(404).json({ message: 'Not found' }); return; }
  const allowed = ['title', 'description', 'source', 'sourceId', 'sourceRef', 'priority', 'category', 'department', 'assignedTo', 'dueDate', 'rootCause', 'resolution', 'closureNotes', 'evidence', 'relatedActionIds', 'tags'];
  const updates: any = {};
  for (const f of allowed) { if (req.body[f] !== undefined) updates[f] = req.body[f]; }
  actions[idx] = { ...actions[idx], ...updates, id: actions[idx].id, createdAt: actions[idx].createdAt, lastUpdated: new Date().toISOString() };
  res.json({ data: actions[idx] });
}));

// ─── Status Workflow ──────────────────────────────────────────────────────────
router.patch('/:id/status', authGuard, asyncHandler(async (req, res) => {
  const a = actions.find(x => x.id === req.params.id);
  if (!a) { res.status(404).json({ message: 'Not found' }); return; }
  const valid: Record<string, string[]> = {
    open: ['in_progress', 'closed', 'rejected'],
    in_progress: ['under_review', 'open', 'closed'],
    under_review: ['closed', 'in_progress', 'rejected'],
    closed: ['open'],
    rejected: ['open'],
  };
  const ns = req.body.status;
  if (!(valid[a.status] || []).includes(ns)) {
    res.status(400).json({ message: `Cannot transition from '${a.status}' to '${ns}'` }); return;
  }
  a.status = ns;
  if (ns === 'closed') a.completedAt = new Date().toISOString();
  if (ns === 'open' || ns === 'in_progress') a.completedAt = null;
  a.lastUpdated = new Date().toISOString();
  res.json({ data: a });
}));

// ─── Comments ─────────────────────────────────────────────────────────────────
router.get('/:id/comments', authGuard, asyncHandler(async (req, res) => {
  const a = actions.find(x => x.id === req.params.id);
  if (!a) { res.status(404).json({ message: 'Not found' }); return; }
  sendSuccess(res, a.comments, 'Comments retrieved');
}));

router.post('/:id/comments', authGuard, asyncHandler(async (req, res) => {
  const a = actions.find(x => x.id === req.params.id);
  if (!a) { res.status(404).json({ message: 'Not found' }); return; }
  if (!req.body.comment?.trim()) { res.status(400).json({ message: 'Comment required' }); return; }
  const nc = { id: `cmt_${nextCmtId++}`, comment: req.body.comment.trim(), userId: req.body.userId || null, createdAt: new Date().toISOString() };
  a.comments.push(nc);
  a.lastUpdated = new Date().toISOString();
  res.status(201).json({ data: nc });
}));

// ─── Checklist ────────────────────────────────────────────────────────────────
router.get('/:id/checklist', authGuard, asyncHandler(async (req, res) => {
  const a = actions.find(x => x.id === req.params.id);
  if (!a) { res.status(404).json({ message: 'Not found' }); return; }
  sendSuccess(res, a.checklist, 'Checklist retrieved');
}));

router.post('/:id/checklist', authGuard, asyncHandler(async (req, res) => {
  const a = actions.find(x => x.id === req.params.id);
  if (!a) { res.status(404).json({ message: 'Not found' }); return; }
  if (!req.body.title?.trim()) { res.status(400).json({ message: 'Item title required' }); return; }
  const ni = { id: `cl_${nextClId++}`, title: req.body.title.trim(), completed: false, completedAt: null, assignedTo: req.body.assignedTo || null };
  a.checklist.push(ni);
  a.lastUpdated = new Date().toISOString();
  res.status(201).json({ data: ni });
}));

router.put('/:id/checklist/:itemId', authGuard, asyncHandler(async (req, res) => {
  const a = actions.find(x => x.id === req.params.id);
  if (!a) { res.status(404).json({ message: 'Not found' }); return; }
  const idx = a.checklist.findIndex((c: any) => c.id === req.params.itemId);
  if (idx === -1) { res.status(404).json({ message: 'Checklist item not found' }); return; }
  if (req.body.completed !== undefined) {
    a.checklist[idx].completed = req.body.completed;
    a.checklist[idx].completedAt = req.body.completed ? new Date().toISOString() : null;
  }
  if (req.body.title !== undefined) a.checklist[idx].title = req.body.title;
  if (req.body.assignedTo !== undefined) a.checklist[idx].assignedTo = req.body.assignedTo;
  a.lastUpdated = new Date().toISOString();
  res.json({ data: a.checklist[idx] });
}));

router.delete('/:id/checklist/:itemId', authGuard, asyncHandler(async (req, res) => {
  const a = actions.find(x => x.id === req.params.id);
  if (!a) { res.status(404).json({ message: 'Not found' }); return; }
  a.checklist = a.checklist.filter((c: any) => c.id !== req.params.itemId);
  a.lastUpdated = new Date().toISOString();
  res.json({ data: a.checklist });
}));

export default router;
