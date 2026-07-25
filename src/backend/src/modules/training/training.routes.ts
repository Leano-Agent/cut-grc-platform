import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess } from '../../middleware/errorMiddleware';

const router = Router();

// Initialize middleware
let authMiddleware: AuthMiddleware;

export const initializeTrainingRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

// ─── In-memory store ──────────────────────────────────────────────────────────
let trainings: any[] = [
  {
    id: 'training_1',
    title: 'POPIA Compliance Training',
    description: 'Mandatory training on the Protection of Personal Information Act (POPIA) covering data subject rights, lawful processing conditions, and breach notification procedures.',
    type: 'mandatory',
    category: 'popia',
    status: 'active',
    department: 'All Departments',
    assignedTo: ['user_1', 'user_2', 'user_3'],
    completionRate: 75,
    dueDate: '2026-12-31',
    expiryDate: '2027-12-31',
    modules: [
      { title: 'Introduction to POPIA', type: 'video', duration: 15, order: 1 },
      { title: 'Data Subject Rights', type: 'reading', duration: 20, order: 2 },
      { title: 'Lawful Processing Conditions', type: 'video', duration: 25, order: 3 },
      { title: 'Breach Notification', type: 'quiz', duration: 10, order: 4 },
      { title: 'Final Assessment', type: 'exam', duration: 30, order: 5 },
    ],
    enrolledUsers: [
      { userId: 'user_1', enrolledAt: '2026-01-15T08:00:00Z', completedAt: '2026-02-10T14:30:00Z', score: 92, status: 'completed' },
      { userId: 'user_2', enrolledAt: '2026-01-15T08:00:00Z', completedAt: '2026-03-01T10:00:00Z', score: 88, status: 'completed' },
      { userId: 'user_3', enrolledAt: '2026-01-15T08:00:00Z', completedAt: null, score: null, status: 'in_progress' },
    ],
    tags: ['popia', 'compliance', 'data-protection', 'mandatory'],
    createdAt: '2025-12-01T08:00:00Z',
    updatedAt: '2026-06-15T10:00:00Z',
  },
  {
    id: 'training_2',
    title: 'Security Awareness - Q3',
    description: 'Quarterly security awareness training covering phishing, social engineering, password hygiene, and safe browsing practices.',
    type: 'mandatory',
    category: 'security',
    status: 'active',
    department: 'All Departments',
    assignedTo: ['user_1', 'user_2', 'user_3', 'user_4', 'user_5'],
    completionRate: 60,
    dueDate: '2026-09-30',
    expiryDate: '2027-03-31',
    modules: [
      { title: 'Phishing Recognition', type: 'video', duration: 10, order: 1 },
      { title: 'Social Engineering', type: 'reading', duration: 15, order: 2 },
      { title: 'Password Best Practices', type: 'interactive', duration: 10, order: 3 },
      { title: 'Safe Browsing', type: 'video', duration: 10, order: 4 },
      { title: 'Security Quiz', type: 'quiz', duration: 15, order: 5 },
    ],
    enrolledUsers: [
      { userId: 'user_1', enrolledAt: '2026-07-01T08:00:00Z', completedAt: '2026-07-15T09:00:00Z', score: 95, status: 'completed' },
      { userId: 'user_2', enrolledAt: '2026-07-01T08:00:00Z', completedAt: '2026-08-01T11:00:00Z', score: 82, status: 'completed' },
      { userId: 'user_3', enrolledAt: '2026-07-01T08:00:00Z', completedAt: null, score: null, status: 'in_progress' },
      { userId: 'user_4', enrolledAt: '2026-07-01T08:00:00Z', completedAt: '2026-07-20T16:00:00Z', score: 78, status: 'completed' },
      { userId: 'user_5', enrolledAt: '2026-07-01T08:00:00Z', completedAt: null, score: null, status: 'pending' },
    ],
    tags: ['security', 'awareness', 'quarterly', 'mandatory'],
    createdAt: '2026-06-01T08:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  },
];

let nextId = 3;

const authGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

// ─── Helper: filter trainings ─────────────────────────────────────────────────
const filterTrainings = (query: any) => {
  let result = [...trainings];

  if (query.category) {
    result = result.filter(t => t.category === query.category);
  }
  if (query.status) {
    result = result.filter(t => t.status === query.status);
  }
  if (query.department) {
    result = result.filter(t => t.department?.toLowerCase() === query.department.toLowerCase());
  }
  if (query.type) {
    result = result.filter(t => t.type === query.type);
  }
  if (query.search) {
    const s = query.search.toLowerCase();
    result = result.filter(t =>
      t.title.toLowerCase().includes(s) ||
      t.description?.toLowerCase().includes(s) ||
      t.tags?.some((tag: string) => tag.toLowerCase().includes(s))
    );
  }

  return result;
};

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/v1/training
 * @desc    Get all training programmes with optional filtering
 * @access  Private
 */
router.get(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const filtered = filterTrainings(req.query);
    sendSuccess(res, filtered, 'Training programmes retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/training/stats/summary
 * @desc    Get training statistics
 * @access  Private
 */
router.get(
  '/stats/summary',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const total = trainings.length;
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalEnrolled = 0;
    let totalCompleted = 0;
    let overdue = 0;

    for (const t of trainings) {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;

      if (t.enrolledUsers) {
        totalEnrolled += t.enrolledUsers.length;
        totalCompleted += t.enrolledUsers.filter((u: any) => u.status === 'completed').length;
      }

      // Check if overdue (active + past due date)
      if (t.status === 'active' && t.dueDate && new Date(t.dueDate) < new Date()) {
        overdue++;
      }
    }

    const overallCompletionRate = totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : 0;

    sendSuccess(res, {
      total,
      active: byStatus['active'] || 0,
      byCategory,
      byStatus,
      completionRate: overallCompletionRate,
      totalEnrolled,
      totalCompleted,
      overdue,
    }, 'Training statistics retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/training/:id
 * @desc    Get training programme by ID
 * @access  Private
 */
router.get(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const training = trainings.find(t => t.id === req.params.id);
    if (!training) {
      res.status(404).json({ message: 'Training programme not found' });
      return;
    }
    sendSuccess(res, training, 'Training programme retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/training
 * @desc    Create a new training programme
 * @access  Private (admin, manager)
 */
router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const { title, description, type, category, department, assignedTo, dueDate, expiryDate, modules, tags } = req.body;

    if (!title || title.trim().length === 0) {
      res.status(400).json({ message: 'Training title is required' });
      return;
    }

    const now = new Date().toISOString();
    const newTraining = {
      id: `training_${nextId++}`,
      title: title.trim(),
      description: description || null,
      type: type || 'mandatory',
      category: category || 'other',
      status: 'draft',
      department: department || null,
      assignedTo: assignedTo || [],
      completionRate: 0,
      dueDate: dueDate || null,
      expiryDate: expiryDate || null,
      modules: modules || [],
      enrolledUsers: [],
      tags: tags || [],
      createdAt: now,
      updatedAt: now,
    };

    trainings.unshift(newTraining);
    res.status(201).json({ data: newTraining });
  })
);

/**
 * @route   PUT /api/v1/training/:id
 * @desc    Update a training programme
 * @access  Private (admin, manager)
 */
router.put(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const index = trainings.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: 'Training programme not found' });
      return;
    }

    const allowedFields = [
      'title', 'description', 'type', 'category', 'department',
      'assignedTo', 'dueDate', 'expiryDate', 'modules', 'tags'
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    trainings[index] = {
      ...trainings[index],
      ...updates,
      id: trainings[index].id,
      createdAt: trainings[index].createdAt,
      updatedAt: new Date().toISOString(),
    };

    res.json({ data: trainings[index] });
  })
);

/**
 * @route   PATCH /api/v1/training/:id/status
 * @desc    Update training workflow status (draft → active → expired → archived)
 * @access  Private (admin)
 */
router.patch(
  '/:id/status',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const training = trainings.find(t => t.id === req.params.id);
    if (!training) {
      res.status(404).json({ message: 'Training programme not found' });
      return;
    }

    const validTransitions: Record<string, string[]> = {
      draft: ['active', 'archived'],
      active: ['expired', 'archived'],
      expired: ['active', 'archived'],
      archived: ['draft'],
    };

    const newStatus = req.body.status;
    const allowed = validTransitions[training.status] || [];

    if (!allowed.includes(newStatus)) {
      res.status(400).json({
        message: `Cannot transition from '${training.status}' to '${newStatus}'. Allowed: ${allowed.join(', ')}`,
      });
      return;
    }

    training.status = newStatus;
    training.updatedAt = new Date().toISOString();

    res.json({ data: training });
  })
);

/**
 * @route   POST /api/v1/training/:id/enroll
 * @desc    Enroll a user in a training programme
 * @access  Private
 */
router.post(
  '/:id/enroll',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const training = trainings.find(t => t.id === req.params.id);
    if (!training) {
      res.status(404).json({ message: 'Training programme not found' });
      return;
    }

    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ message: 'UserId is required' });
      return;
    }

    // Check if already enrolled
    const alreadyEnrolled = training.enrolledUsers.find((u: any) => u.userId === userId);
    if (alreadyEnrolled) {
      res.status(400).json({ message: 'User is already enrolled in this training programme' });
      return;
    }

    const now = new Date().toISOString();
    training.enrolledUsers.push({
      userId,
      enrolledAt: now,
      completedAt: null,
      score: null,
      status: 'pending',
    });

    // Add user to assignedTo if not already
    if (!training.assignedTo.includes(userId)) {
      training.assignedTo.push(userId);
    }

    training.updatedAt = now;

    res.status(201).json({ data: training });
  })
);

/**
 * @route   PATCH /api/v1/training/:id/users/:userId
 * @desc    Mark user completion with score
 * @access  Private (admin, manager)
 */
router.patch(
  '/:id/users/:userId',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const training = trainings.find(t => t.id === req.params.id);
    if (!training) {
      res.status(404).json({ message: 'Training programme not found' });
      return;
    }

    const enrolledUser = training.enrolledUsers.find((u: any) => u.userId === req.params.userId);
    if (!enrolledUser) {
      res.status(404).json({ message: 'User not enrolled in this training programme' });
      return;
    }

    const { score, status } = req.body;
    const now = new Date().toISOString();

    enrolledUser.score = score !== undefined ? score : enrolledUser.score;
    enrolledUser.status = status || 'completed';

    if (status === 'completed' || (!status && enrolledUser.status === 'pending')) {
      enrolledUser.completedAt = now;
      enrolledUser.status = 'completed';
    }

    training.updatedAt = now;

    // Recalculate completion rate
    const total = training.enrolledUsers.length;
    const completed = training.enrolledUsers.filter((u: any) => u.status === 'completed').length;
    training.completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({ data: training });
  })
);

/**
 * @route   DELETE /api/v1/training/:id
 * @desc    Archive a training programme
 * @access  Private (admin)
 */
router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const index = trainings.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: 'Training programme not found' });
      return;
    }
    // Soft delete — archive instead
    trainings[index].status = 'archived';
    trainings[index].updatedAt = new Date().toISOString();
    res.json({ message: 'Training programme archived successfully' });
  })
);

export default router;
