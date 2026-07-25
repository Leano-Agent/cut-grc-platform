import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess } from '../../middleware/errorMiddleware';

const router = Router();
let authMiddleware: AuthMiddleware;

export const initializeSurveyRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Question {
  id: string;
  type: 'text' | 'paragraph' | 'multiple_choice' | 'single_choice' | 'rating' | 'date' | 'file' | 'email' | 'number';
  title: string;
  description: string | null;
  required: boolean;
  options: string[] | null;
  defaultValue: string | null;
  order: number;
  validation: { min?: number; max?: number; minLength?: number; maxLength?: number; pattern?: string } | null;
}

interface Answer {
  questionId: string;
  value: string | string[];
}

interface SurveyResponse {
  id: string;
  surveyId: string;
  respondent: string | null;
  respondentEmail: string | null;
  answers: Answer[];
  submittedAt: string;
}

// ─── In-memory store ──────────────────────────────────────────────────────────
let surveys: any[] = [
  {
    id: 'srv_1',
    title: 'Annual Compliance Self-Assessment',
    description: 'Annual assessment to evaluate departmental compliance with regulatory requirements and internal policies.',
    category: 'compliance',
    status: 'published',
    questions: [
      { id: 'q1', type: 'single_choice', title: 'Has your department completed the mandatory POPIA training?', description: null, required: true, options: ['Yes, all staff completed', 'Partially completed', 'Not yet started', 'Not applicable'], defaultValue: null, order: 1, validation: null },
      { id: 'q2', type: 'multiple_choice', title: 'Which of the following security controls are implemented?', description: 'Select all that apply', required: true, options: ['Access Control', 'Encryption at Rest', 'Encryption in Transit', 'MFA', 'Audit Logging', 'Incident Response Plan'], defaultValue: null, order: 2, validation: null },
      { id: 'q3', type: 'rating', title: 'Rate your department\'s overall compliance readiness', description: '1 = Not ready, 5 = Fully compliant', required: true, options: null, defaultValue: null, order: 3, validation: { min: 1, max: 5 } },
      { id: 'q4', type: 'text', title: 'Identified compliance gaps', description: 'List any compliance gaps your department has identified', required: false, options: null, defaultValue: null, order: 4, validation: null },
      { id: 'q5', type: 'paragraph', title: 'Additional comments', description: 'Any other compliance concerns or feedback', required: false, options: null, defaultValue: null, order: 5, validation: null },
    ],
    department: 'All Departments',
    targetAudience: 'Department Heads and Compliance Officers',
    anonymous: false,
    requireLogin: true,
    allowMultipleSubmissions: false,
    maxSubmissions: null,
    closeDate: '2026-09-30T00:00:00Z',
    totalResponses: 12,
    tags: ['compliance', 'popia', 'annual'],
    metadata: {},
    lastUpdated: '2026-07-01T09:00:00Z',
    createdAt: '2026-06-01T08:00:00Z',
  },
  {
    id: 'srv_2',
    title: 'IT Security Awareness Survey',
    description: 'Quarterly survey to measure employee security awareness and identify areas needing additional training.',
    category: 'security',
    status: 'published',
    questions: [
      { id: 'q1', type: 'single_choice', title: 'How often do you change your password?', description: null, required: true, options: ['Every 30 days', 'Every 60 days', 'Every 90 days', 'Only when forced', 'Never'], defaultValue: null, order: 1, validation: null },
      { id: 'q2', type: 'single_choice', title: 'What would you do if you received a suspicious email?', description: null, required: true, options: ['Report to IT immediately', 'Delete it', 'Open it to check', 'Forward to colleagues', 'Click the link'], defaultValue: null, order: 2, validation: null },
      { id: 'q3', type: 'multiple_choice', title: 'Which security topics would you like more training on?', description: 'Select up to 3', required: false, options: ['Phishing Awareness', 'Password Security', 'Data Privacy', 'Social Engineering', 'Mobile Security', 'Cloud Security', 'Incident Reporting'], defaultValue: null, order: 3, validation: null },
      { id: 'q4', type: 'rating', title: 'How confident are you in identifying phishing attempts?', description: '1 = Not confident, 5 = Very confident', required: true, options: null, defaultValue: null, order: 4, validation: { min: 1, max: 5 } },
    ],
    department: 'IT',
    targetAudience: 'All Employees',
    anonymous: true,
    requireLogin: false,
    allowMultipleSubmissions: false,
    maxSubmissions: null,
    closeDate: '2026-08-15T00:00:00Z',
    totalResponses: 47,
    tags: ['security', 'awareness', 'training'],
    metadata: {},
    lastUpdated: '2026-07-10T14:00:00Z',
    createdAt: '2026-06-15T10:00:00Z',
  },
];

let nextSurveyId = 3;
let nextQuestionId = 50;

// ─── In-memory response store ─────────────────────────────────────────────────
let responses: SurveyResponse[] = [
  {
    id: 'resp_1',
    surveyId: 'srv_1',
    respondent: 'John Molefe',
    respondentEmail: 'john@cut.ac.za',
    answers: [
      { questionId: 'q1', value: 'Yes, all staff completed' },
      { questionId: 'q2', value: ['Access Control', 'MFA', 'Audit Logging'] },
      { questionId: 'q3', value: '4' },
      { questionId: 'q4', value: 'Minor gap in incident response documentation' },
      { questionId: 'q5', value: 'Overall compliance posture is strong' },
    ],
    submittedAt: '2026-06-15T11:30:00Z',
  },
  {
    id: 'resp_2',
    surveyId: 'srv_1',
    respondent: 'Thabo Nkosi',
    respondentEmail: 'thabo@cut.ac.za',
    answers: [
      { questionId: 'q1', value: 'Partially completed' },
      { questionId: 'q2', value: ['Encryption at Rest', 'Encryption in Transit', 'Audit Logging'] },
      { questionId: 'q3', value: '3' },
      { questionId: 'q4', value: 'Finance department needs POPIA refresher' },
    ],
    submittedAt: '2026-06-20T09:15:00Z',
  },
];

let nextResponseId = 3;

const authGuard = (req: Request, res: Response, next: any) =>
  authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();

// ─── Helper: generate question ID ─────────────────────────────────────────────
const genQuestionId = () => `q_${nextQuestionId++}`;

// ─── Helper: compute survey results ───────────────────────────────────────────
const computeResults = (survey: any) => {
  const surveyResponses = responses.filter(r => r.surveyId === survey.id);
  if (surveyResponses.length === 0) return { totalResponses: 0, questions: [] };

  return {
    totalResponses: surveyResponses.length,
    questions: survey.questions.map((q: Question) => {
      const answers = surveyResponses.map(r => r.answers.find(a => a.questionId === q.id)).filter(Boolean);
      
      if (['single_choice', 'multiple_choice'].includes(q.type)) {
        const optionCounts: Record<string, number> = {};
        const allOptions = q.options || [];
        for (const opt of allOptions) optionCounts[opt] = 0;
        
        for (const a of answers) {
          const vals = Array.isArray(a!.value) ? a!.value : [a!.value];
          for (const v of vals) {
            if (optionCounts[v] !== undefined) optionCounts[v]++;
          }
        }
        return { questionId: q.id, title: q.title, type: q.type, optionCounts };
      }

      if (q.type === 'rating') {
        const ratings = answers.map(a => parseInt(a!.value as string)).filter(n => !isNaN(n));
        const avg = ratings.length > 0 ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;
        return { questionId: q.id, title: q.title, type: q.type, average: Math.round(avg * 10) / 10, distribution: ratings };
      }

      // Text/paragraph responses
      return { questionId: q.id, title: q.title, type: q.type, responses: answers.map(a => a!.value) };
    }),
  };
};

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/v1/surveys
 * @desc    List surveys with filtering
 */
router.get(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    let result = [...surveys];
    if (req.query.category) result = result.filter(s => s.category === req.query.category);
    if (req.query.status) result = result.filter(s => s.status === req.query.status);
    if (req.query.search) {
      const s = (req.query.search as string).toLowerCase();
      result = result.filter(sv => sv.title.toLowerCase().includes(s) || sv.tags?.some((t: string) => t.includes(s)));
    }
    sendSuccess(res, result, 'Surveys retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/surveys/stats/summary
 * @desc    Survey statistics
 */
router.get(
  '/stats/summary',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const total = surveys.length;
    const byStatus: Record<string, number> = {};
    let totalResponses = 0;
    let activePublished = 0;
    for (const s of surveys) {
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
      totalResponses += s.totalResponses;
      if (s.status === 'published') activePublished++;
    }
    sendSuccess(res, { total, byStatus, activePublished, totalResponses }, 'Survey stats retrieved');
  })
);

/**
 * @route   GET /api/v1/surveys/:id
 * @desc    Get survey by ID
 */
router.get(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const survey = surveys.find(s => s.id === req.params.id);
    if (!survey) { res.status(404).json({ message: 'Survey not found' }); return; }
    sendSuccess(res, survey, 'Survey retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/surveys
 * @desc    Create a new survey
 */
router.post(
  '/',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const { title, description, category, department, targetAudience, anonymous, requireLogin, allowMultipleSubmissions, closeDate, tags } = req.body;
    if (!title || title.trim().length === 0) {
      res.status(400).json({ message: 'Survey title is required' }); return;
    }
    const now = new Date().toISOString();
    const newSurvey = {
      id: `srv_${nextSurveyId++}`,
      title: title.trim(),
      description: description || null,
      category: category || 'other',
      status: 'draft',
      questions: [],
      department: department || null,
      targetAudience: targetAudience || null,
      anonymous: anonymous || false,
      requireLogin: requireLogin !== undefined ? requireLogin : true,
      allowMultipleSubmissions: allowMultipleSubmissions || false,
      maxSubmissions: null,
      closeDate: closeDate || null,
      totalResponses: 0,
      tags: tags || [],
      metadata: {},
      lastUpdated: now,
      createdAt: now,
    };
    surveys.unshift(newSurvey);
    res.status(201).json({ data: newSurvey });
  })
);

/**
 * @route   PUT /api/v1/surveys/:id
 * @desc    Update survey details
 */
router.put(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const index = surveys.findIndex(s => s.id === req.params.id);
    if (index === -1) { res.status(404).json({ message: 'Survey not found' }); return; }
    const allowed = ['title', 'description', 'category', 'department', 'targetAudience', 'anonymous', 'requireLogin', 'allowMultipleSubmissions', 'closeDate', 'tags'];
    const updates: any = {};
    for (const f of allowed) { if (req.body[f] !== undefined) updates[f] = req.body[f]; }
    surveys[index] = { ...surveys[index], ...updates, id: surveys[index].id, createdAt: surveys[index].createdAt, lastUpdated: new Date().toISOString() };
    res.json({ data: surveys[index] });
  })
);

/**
 * @route   PATCH /api/v1/surveys/:id/status
 * @desc    Publish, close, or archive survey
 */
router.patch(
  '/:id/status',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const survey = surveys.find(s => s.id === req.params.id);
    if (!survey) { res.status(404).json({ message: 'Survey not found' }); return; }
    const valid: Record<string, string[]> = {
      draft: ['published', 'archived'],
      published: ['closed', 'draft'],
      closed: ['published', 'archived'],
      archived: ['draft'],
    };
    const newStatus = req.body.status;
    if (!(valid[survey.status] || []).includes(newStatus)) {
      res.status(400).json({ message: `Cannot transition from '${survey.status}' to '${newStatus}'` }); return;
    }
    survey.status = newStatus;
    survey.lastUpdated = new Date().toISOString();
    res.json({ data: survey });
  })
);

/**
 * @route   POST /api/v1/surveys/:id/questions
 * @desc    Add a question to a survey
 */
router.post(
  '/:id/questions',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const survey = surveys.find(s => s.id === req.params.id);
    if (!survey) { res.status(404).json({ message: 'Survey not found' }); return; }
    if (!['draft', 'published'].includes(survey.status)) {
      res.status(400).json({ message: 'Can only add questions to draft or published surveys' }); return;
    }
    const { type, title, description, required, options, defaultValue, validation } = req.body;
    if (!title || !type) { res.status(400).json({ message: 'Question type and title are required' }); return; }
    const newQuestion: Question = {
      id: genQuestionId(),
      type, title, description: description || null,
      required: required || false,
      options: options || null,
      defaultValue: defaultValue || null,
      order: survey.questions.length + 1,
      validation: validation || null,
    };
    survey.questions.push(newQuestion);
    survey.lastUpdated = new Date().toISOString();
    res.status(201).json({ data: newQuestion });
  })
);

/**
 * @route   PUT /api/v1/surveys/:id/questions/:questionId
 * @desc    Update a question
 */
router.put(
  '/:id/questions/:questionId',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const survey = surveys.find(s => s.id === req.params.id);
    if (!survey) { res.status(404).json({ message: 'Survey not found' }); return; }
    const idx = survey.questions.findIndex((q: any) => q.id === req.params.questionId);
    if (idx === -1) { res.status(404).json({ message: 'Question not found' }); return; }
    const allowed = ['type', 'title', 'description', 'required', 'options', 'defaultValue', 'validation'];
    const updates: any = {};
    for (const f of allowed) { if (req.body[f] !== undefined) updates[f] = req.body[f]; }
    survey.questions[idx] = { ...survey.questions[idx], ...updates };
    survey.lastUpdated = new Date().toISOString();
    res.json({ data: survey.questions[idx] });
  })
);

/**
 * @route   DELETE /api/v1/surveys/:id/questions/:questionId
 * @desc    Delete a question
 */
router.delete(
  '/:id/questions/:questionId',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const survey = surveys.find(s => s.id === req.params.id);
    if (!survey) { res.status(404).json({ message: 'Survey not found' }); return; }
    survey.questions = survey.questions.filter((q: any) => q.id !== req.params.questionId);
    // Re-number orders
    survey.questions.forEach((q: any, i: number) => q.order = i + 1);
    survey.lastUpdated = new Date().toISOString();
    res.json({ data: survey.questions });
  })
);

/**
 * @route   PUT /api/v1/surveys/:id/questions/reorder
 * @desc    Reorder questions
 */
router.put(
  '/:id/questions/reorder',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const survey = surveys.find(s => s.id === req.params.id);
    if (!survey) { res.status(404).json({ message: 'Survey not found' }); return; }
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds)) { res.status(400).json({ message: 'questionIds array required' }); return; }
    survey.questions.sort((a: any, b: any) => questionIds.indexOf(a.id) - questionIds.indexOf(b.id));
    survey.questions.forEach((q: any, i: number) => q.order = i + 1);
    survey.lastUpdated = new Date().toISOString();
    res.json({ data: survey.questions });
  })
);

/**
 * @route   POST /api/v1/surveys/:id/responses
 * @desc    Submit a survey response (public endpoint — auth optional)
 */
router.post(
  '/:id/responses',
  (req: Request, res: Response, next: any) => {
    // Try auth, but allow anonymous submissions
    if (authMiddleware) {
      return authMiddleware.verifyToken(req, res, (err?: any) => {
        if (err) { /* continue without auth */ }
        next();
      });
    }
    next();
  },
  asyncHandler(async (req: Request, res: Response) => {
    const survey = surveys.find(s => s.id === req.params.id);
    if (!survey) { res.status(404).json({ message: 'Survey not found' }); return; }
    if (survey.status !== 'published') { res.status(400).json({ message: 'Survey is not accepting responses' }); return; }

    const { answers, respondent, respondentEmail } = req.body;
    if (!Array.isArray(answers)) { res.status(400).json({ message: 'Answers array required' }); return; }

    // Validate required questions
    const missing = survey.questions
      .filter((q: any) => q.required && !answers.find((a: any) => a.questionId === q.id))
      .map((q: any) => q.title);
    if (missing.length > 0) {
      res.status(400).json({ message: `Required questions missing: ${missing.join(', ')}` }); return;
    }

    const now = new Date().toISOString();
    const newResponse: SurveyResponse = {
      id: `resp_${nextResponseId++}`,
      surveyId: survey.id,
      respondent: respondent || (req as any).user?.email || 'Anonymous',
      respondentEmail: respondentEmail || null,
      answers,
      submittedAt: now,
    };
    responses.unshift(newResponse);
    survey.totalResponses++;

    res.status(201).json({ data: { responseId: newResponse.id, message: 'Response submitted successfully' } });
  })
);

/**
 * @route   GET /api/v1/surveys/:id/responses
 * @desc    Get all responses for a survey
 */
router.get(
  '/:id/responses',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const survey = surveys.find(s => s.id === req.params.id);
    if (!survey) { res.status(404).json({ message: 'Survey not found' }); return; }
    const surveyResponses = responses.filter(r => r.surveyId === req.params.id);
    sendSuccess(res, surveyResponses, 'Responses retrieved');
  })
);

/**
 * @route   GET /api/v1/surveys/:id/results
 * @desc    Get survey results/analytics
 */
router.get(
  '/:id/results',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const survey = surveys.find(s => s.id === req.params.id);
    if (!survey) { res.status(404).json({ message: 'Survey not found' }); return; }
    const results = computeResults(survey);
    sendSuccess(res, results, 'Survey results retrieved');
  })
);

/**
 * @route   DELETE /api/v1/surveys/:id
 * @desc    Delete (archive) a survey
 */
router.delete(
  '/:id',
  authGuard,
  asyncHandler(async (req: Request, res: Response) => {
    const index = surveys.findIndex(s => s.id === req.params.id);
    if (index === -1) { res.status(404).json({ message: 'Survey not found' }); return; }
    surveys[index].status = 'archived';
    surveys[index].lastUpdated = new Date().toISOString();
    res.json({ message: 'Survey archived successfully' });
  })
);

export default router;
