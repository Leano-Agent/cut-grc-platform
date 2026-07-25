import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess } from '../../middleware/errorMiddleware';

const router = Router();
let authMiddleware: AuthMiddleware;
export const initializeBoardRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

const authGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

// ─── In-memory store ──────────────────────────────────────────────────────────
let boards: any[] = [
  {
    id: 'brd_1', name: 'Governance Committee', description: 'Oversees corporate governance, policy development, and regulatory compliance across all municipal entities.',
    type: 'committee', category: 'governance', status: 'active',
    charter: 'To ensure effective governance practices and regulatory compliance across the organisation.',
    mission: 'Promote transparency, accountability, and ethical conduct.',
    meetingFrequency: 'Monthly', quorum: 5, termLength: 24,
    parentBoardId: null,
    members: [
      { userId: 'user_1', role: 'chairperson', position: 'Chief Governance Officer', appointedAt: '2025-01-01', termEnd: '2027-01-01', isActive: true },
      { userId: 'user_2', role: 'vice_chairperson', position: 'Head of Legal', appointedAt: '2025-01-01', termEnd: '2027-01-01', isActive: true },
      { userId: 'user_3', role: 'secretary', position: 'Company Secretary', appointedAt: '2025-06-01', termEnd: '2027-06-01', isActive: true },
      { userId: 'user_4', role: 'member', position: 'Risk Manager', appointedAt: '2025-01-01', termEnd: '2027-01-01', isActive: true },
      { userId: 'user_5', role: 'member', position: 'Compliance Officer', appointedAt: '2025-03-01', termEnd: '2027-03-01', isActive: true },
      { userId: 'user_6', role: 'observer', position: 'External Auditor', appointedAt: '2025-01-01', termEnd: null, isActive: true },
    ],
    meetings: [
      { id: 'mtg_1', title: 'Q2 Governance Review', date: '2026-07-10T09:00:00Z', status: 'completed', location: 'Boardroom A', agenda: [
        { item: 'Call to order & quorum check', description: null, presenter: null, duration: 5 },
        { item: 'Minutes of previous meeting', description: 'Review and approval', presenter: 'Secretary', duration: 10 },
        { item: 'Policy review update', description: 'Status of 5 policies under review', presenter: 'Chairperson', duration: 20 },
        { item: 'Regulatory update', description: 'New POPIA guidelines', presenter: 'Compliance Officer', duration: 15 },
        { item: 'Any other business', description: null, presenter: null, duration: 10 },
      ], minutes: 'All policies reviewed. POPIA guidelines circulated for implementation. Next meeting scheduled for 10 August.', decisions: [
        { title: 'Policy 3.2 Approved', description: 'Updated Data Privacy Policy approved', status: 'approved', owner: 'Chairperson', dueDate: '2026-07-25' },
        { title: 'POPIA Training Mandate', description: 'Mandatory POPIA training for all departments by Q4', status: 'approved', owner: 'Compliance Officer', dueDate: '2026-09-30' },
      ], attendance: [
        { userId: 'user_1', status: 'present' }, { userId: 'user_2', status: 'present' },
        { userId: 'user_3', status: 'present' }, { userId: 'user_4', status: 'present' },
        { userId: 'user_5', status: 'late' }, { userId: 'user_6', status: 'present' },
      ]},
      { id: 'mtg_2', title: 'Q3 Governance Planning', date: '2026-08-10T09:00:00Z', status: 'scheduled', location: 'Boardroom A', agenda: [
        { item: 'Call to order', description: null, presenter: null, duration: 5 },
        { item: 'Q2 minutes approval', description: null, presenter: 'Secretary', duration: 10 },
        { item: 'Annual compliance report', description: 'Draft review', presenter: 'Compliance Officer', duration: 30 },
      ], minutes: null, decisions: [], attendance: [] },
    ],
    tags: ['governance', 'compliance', 'policies'], metadata: {},
    lastUpdated: '2026-07-10T11:00:00Z', createdAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'brd_2', name: 'Audit Committee', description: 'Oversees financial reporting, internal controls, and audit processes.',
    type: 'committee', category: 'audit', status: 'active',
    charter: 'To oversee the integrity of financial reporting and effectiveness of internal controls.',
    mission: null, meetingFrequency: 'Quarterly', quorum: 3, termLength: 24,
    parentBoardId: null,
    members: [
      { userId: 'user_2', role: 'chairperson', position: 'Head of Legal', appointedAt: '2025-01-01', termEnd: '2027-01-01', isActive: true },
      { userId: 'user_4', role: 'member', position: 'Risk Manager', appointedAt: '2025-01-01', termEnd: '2027-01-01', isActive: true },
    ],
    meetings: [],
    tags: ['audit', 'finance', 'internal-controls'], metadata: {},
    lastUpdated: '2026-06-01T10:00:00Z', createdAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'brd_3', name: 'IT Steering Committee', description: 'Guides IT strategy, cybersecurity investments, and digital transformation initiatives.',
    type: 'committee', category: 'it', status: 'active',
    charter: 'To align IT strategy with business objectives and oversee technology risk management.',
    mission: 'Drive digital transformation while ensuring security and compliance.',
    meetingFrequency: 'Monthly', quorum: 4, termLength: 12,
    parentBoardId: null,
    members: [
      { userId: 'user_1', role: 'chairperson', position: 'CTO', appointedAt: '2025-06-01', termEnd: '2026-06-01', isActive: true },
    ],
    meetings: [],
    tags: ['it', 'cybersecurity', 'digital-transformation'], metadata: {},
    lastUpdated: '2026-05-15T14:00:00Z', createdAt: '2025-06-01T08:00:00Z',
  },
];
let nextBoardId = 4, nextMeetingId = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const filterBoards = (q: any) => {
  let r = [...boards];
  if (q.type) r = r.filter(b => b.type === q.type);
  if (q.status) r = r.filter(b => b.status === q.status);
  if (q.category) r = r.filter(b => b.category === q.category);
  if (q.search) { const s = q.search.toLowerCase(); r = r.filter(b => b.name.toLowerCase().includes(s) || b.tags?.some((t: string) => t.includes(s))); }
  return r;
};

const computeStats = () => {
  const total = boards.length, byType: Record<string, number> = {}, byStatus: Record<string, number> = {};
  let totalMembers = 0, totalMeetings = 0, upcomingMeetings = 0;
  for (const b of boards) {
    byType[b.type] = (byType[b.type] || 0) + 1;
    byStatus[b.status] = (byStatus[b.status] || 0) + 1;
    totalMembers += b.members?.filter((m: any) => m.isActive).length || 0;
    totalMeetings += b.meetings?.length || 0;
    upcomingMeetings += b.meetings?.filter((m: any) => m.status === 'scheduled').length || 0;
  }
  return { total, byType, byStatus, totalMembers, totalMeetings, upcomingMeetings };
};

// ─── Board CRUD ───────────────────────────────────────────────────────────────
router.get('/', authGuard, asyncHandler(async (req, res) => sendSuccess(res, filterBoards(req.query), 'Boards retrieved')));
router.get('/stats/summary', authGuard, asyncHandler(async (req, res) => sendSuccess(res, computeStats(), 'Stats retrieved')));

router.get('/:id', authGuard, asyncHandler(async (req, res) => {
  const b = boards.find(x => x.id === req.params.id);
  if (!b) { res.status(404).json({ message: 'Board not found' }); return; }
  sendSuccess(res, b, 'Board retrieved');
}));

router.post('/', authGuard, asyncHandler(async (req, res) => {
  const { name, description, type, category, charter, mission, meetingFrequency, quorum, termLength, tags } = req.body;
  if (!name?.trim()) { res.status(400).json({ message: 'Board name required' }); return; }
  const now = new Date().toISOString();
  const nb = {
    id: `brd_${nextBoardId++}`, name: name.trim(), description: description || null,
    type: type || 'committee', category: category || 'other', status: 'active',
    charter: charter || null, mission: mission || null,
    meetingFrequency: meetingFrequency || null, quorum: quorum || null, termLength: termLength || null,
    parentBoardId: null, members: [], meetings: [], tags: tags || [], metadata: {},
    lastUpdated: now, createdAt: now,
  };
  boards.unshift(nb);
  res.status(201).json({ data: nb });
}));

router.put('/:id', authGuard, asyncHandler(async (req, res) => {
  const idx = boards.findIndex(x => x.id === req.params.id);
  if (idx === -1) { res.status(404).json({ message: 'Board not found' }); return; }
  const allowed = ['name', 'description', 'type', 'category', 'charter', 'mission', 'meetingFrequency', 'quorum', 'termLength', 'tags', 'status'];
  const updates: any = {};
  for (const f of allowed) { if (req.body[f] !== undefined) updates[f] = req.body[f]; }
  boards[idx] = { ...boards[idx], ...updates, id: boards[idx].id, createdAt: boards[idx].createdAt, lastUpdated: new Date().toISOString() };
  res.json({ data: boards[idx] });
}));

router.delete('/:id', authGuard, asyncHandler(async (req, res) => {
  const idx = boards.findIndex(x => x.id === req.params.id);
  if (idx === -1) { res.status(404).json({ message: 'Board not found' }); return; }
  boards[idx].status = 'dissolved';
  boards[idx].lastUpdated = new Date().toISOString();
  res.json({ message: 'Board dissolved' });
}));

// ─── Members ──────────────────────────────────────────────────────────────────
router.get('/:id/members', authGuard, asyncHandler(async (req, res) => {
  const b = boards.find(x => x.id === req.params.id);
  if (!b) { res.status(404).json({ message: 'Board not found' }); return; }
  sendSuccess(res, b.members, 'Members retrieved');
}));

router.post('/:id/members', authGuard, asyncHandler(async (req, res) => {
  const b = boards.find(x => x.id === req.params.id);
  if (!b) { res.status(404).json({ message: 'Board not found' }); return; }
  const { userId, role, position, termEnd } = req.body;
  if (!userId) { res.status(400).json({ message: 'userId required' }); return; }
  if (b.members.find((m: any) => m.userId === userId)) { res.status(400).json({ message: 'Member already exists' }); return; }
  const nm = { userId, role: role || 'member', position: position || null, appointedAt: new Date().toISOString(), termEnd: termEnd || null, isActive: true };
  b.members.push(nm);
  b.lastUpdated = new Date().toISOString();
  res.status(201).json({ data: nm });
}));

router.put('/:id/members/:userId', authGuard, asyncHandler(async (req, res) => {
  const b = boards.find(x => x.id === req.params.id);
  if (!b) { res.status(404).json({ message: 'Board not found' }); return; }
  const m = b.members.find((x: any) => x.userId === req.params.userId);
  if (!m) { res.status(404).json({ message: 'Member not found' }); return; }
  ['role', 'position', 'termEnd', 'isActive'].forEach(f => { if (req.body[f] !== undefined) m[f] = req.body[f]; });
  b.lastUpdated = new Date().toISOString();
  res.json({ data: m });
}));

router.delete('/:id/members/:userId', authGuard, asyncHandler(async (req, res) => {
  const b = boards.find(x => x.id === req.params.id);
  if (!b) { res.status(404).json({ message: 'Board not found' }); return; }
  b.members = b.members.filter((x: any) => x.userId !== req.params.userId);
  b.lastUpdated = new Date().toISOString();
  res.json({ data: b.members });
}));

// ─── Meetings ─────────────────────────────────────────────────────────────────
router.get('/:id/meetings', authGuard, asyncHandler(async (req, res) => {
  const b = boards.find(x => x.id === req.params.id);
  if (!b) { res.status(404).json({ message: 'Board not found' }); return; }
  sendSuccess(res, b.meetings, 'Meetings retrieved');
}));

router.post('/:id/meetings', authGuard, asyncHandler(async (req, res) => {
  const b = boards.find(x => x.id === req.params.id);
  if (!b) { res.status(404).json({ message: 'Board not found' }); return; }
  const { title, date, location, agenda } = req.body;
  if (!title?.trim()) { res.status(400).json({ message: 'Meeting title required' }); return; }
  const nm = {
    id: `mtg_${nextMeetingId++}`, title: title.trim(), date: date || new Date().toISOString(),
    status: 'scheduled', location: location || null,
    agenda: agenda || [], minutes: null, decisions: [], attendance: [],
  };
  b.meetings.unshift(nm);
  b.lastUpdated = new Date().toISOString();
  res.status(201).json({ data: nm });
}));

router.put('/:id/meetings/:meetingId', authGuard, asyncHandler(async (req, res) => {
  const b = boards.find(x => x.id === req.params.id);
  if (!b) { res.status(404).json({ message: 'Board not found' }); return; }
  const m = b.meetings.find((x: any) => x.id === req.params.meetingId);
  if (!m) { res.status(404).json({ message: 'Meeting not found' }); return; }
  ['title', 'date', 'status', 'location', 'agenda', 'minutes', 'decisions', 'attendance'].forEach(f => { if (req.body[f] !== undefined) m[f] = req.body[f]; });
  b.lastUpdated = new Date().toISOString();
  res.json({ data: m });
}));

router.post('/:id/meetings/:meetingId/attendance', authGuard, asyncHandler(async (req, res) => {
  const b = boards.find(x => x.id === req.params.id);
  if (!b) { res.status(404).json({ message: 'Board not found' }); return; }
  const m = b.meetings.find((x: any) => x.id === req.params.meetingId);
  if (!m) { res.status(404).json({ message: 'Meeting not found' }); return; }
  const { userId, status } = req.body;
  if (!userId) { res.status(400).json({ message: 'userId required' }); return; }
  const existing = m.attendance.findIndex((a: any) => a.userId === userId);
  const record = { userId, status: status || 'present' };
  if (existing >= 0) m.attendance[existing] = record;
  else m.attendance.push(record);
  b.lastUpdated = new Date().toISOString();
  res.json({ data: m.attendance });
}));

router.post('/:id/meetings/:meetingId/decisions', authGuard, asyncHandler(async (req, res) => {
  const b = boards.find(x => x.id === req.params.id);
  if (!b) { res.status(404).json({ message: 'Board not found' }); return; }
  const m = b.meetings.find((x: any) => x.id === req.params.meetingId);
  if (!m) { res.status(404).json({ message: 'Meeting not found' }); return; }
  const { title, description, owner, dueDate } = req.body;
  if (!title) { res.status(400).json({ message: 'Decision title required' }); return; }
  const nd = { title, description: description || null, status: 'approved', owner: owner || null, dueDate: dueDate || null };
  m.decisions.push(nd);
  b.lastUpdated = new Date().toISOString();
  res.status(201).json({ data: nd });
}));

export default router;
