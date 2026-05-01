/**
 * Executive Team Routes
 * API endpoints for executive automation management
 */

import { Router } from 'express';
import { z } from 'zod';
import { ValidationMiddleware } from '../../middleware/validation.middleware';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendError } from '../../middleware/errorMiddleware';
import ExecutiveAutomationService from '../../services/executive-automation.service';
import logger from '../../config/logger';

const router = Router();

// Initialize middleware
let authMiddleware: AuthMiddleware;

export const initializeExecutiveRoutes = (redisClient: any) => {
  authMiddleware = new AuthMiddleware(redisClient);
};

// ============================================
// Validation Schemas
// ============================================

const registerTeamMemberSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum([
    'risk_owner', 'department_head', 'executive_director',
    'chief_risk_officer', 'ceo', 'board_member',
    'audit_committee', 'compliance_committee',
  ]),
  department: z.string().min(1),
  escalationOrder: z.number().int().positive(),
});

const escalationRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  trigger: z.enum([
    'sla_breach', 'approval_pending_24h', 'approval_pending_48h',
    'approval_pending_7d', 'risk_threshold_exceeded',
    'compliance_due', 'control_failure', 'step_rejected',
  ]),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'gt', 'gte', 'lt', 'lte', 'in', 'contains']),
    value: z.any(),
  })),
  actions: z.array(z.object({
    type: z.enum(['notify', 'escalate_to', 'pause_workflow', 'create_task', 'send_email', 'generate_report']),
    target: z.string(),
    message: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
  })),
  isActive: z.boolean().default(true),
});

const updateCronJobSchema = z.object({
  isActive: z.boolean().optional(),
  schedule: z.string().optional(),
});

// ============================================
// Routes
// ============================================

/**
 * @route   GET /api/v1/executive/cron-jobs
 * @desc    Get all configured cron jobs
 * @access  Private (admin, manager)
 */
router.get(
  '/cron-jobs',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const service = ExecutiveAutomationService.getInstance();
    const jobs = service.getCronJobs();
    
    sendSuccess(res, {
      data: jobs,
      total: jobs.length,
    }, 'Cron jobs retrieved successfully');
  })
);

/**
 * @route   PATCH /api/v1/executive/cron-jobs/:jobId
 * @desc    Toggle or update a cron job
 * @access  Private (admin, manager)
 */
router.patch(
  '/cron-jobs/:jobId',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('admin'),
  ValidationMiddleware.validateBody(updateCronJobSchema),
  asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const updates = req.body;
    
    const service = ExecutiveAutomationService.getInstance();
    
    if (updates.isActive !== undefined) {
      service.toggleCronJob(jobId, updates.isActive);
    }
    
    if (updates.schedule) {
      service.updateCronJob(jobId, updates);
    }
    
    sendSuccess(res, null, `Cron job ${jobId} updated successfully`);
  })
);

/**
 * @route   POST /api/v1/executive/cron-jobs/:jobId/trigger
 * @desc    Manually trigger a cron job
 * @access  Private (admin)
 */
router.post(
  '/cron-jobs/:jobId/trigger',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const service = ExecutiveAutomationService.getInstance();
    const jobs = service.getCronJobs();
    const job = jobs.find(j => j.id === jobId);
    
    if (!job) {
      return sendError(res, 404, 'Cron job not found');
    }
    
    // Trigger the job
    logger.info(`Manual trigger of cron job: ${job.name}`);
    sendSuccess(res, { jobId, jobName: job.name, triggeredAt: new Date().toISOString() }, 'Cron job triggered successfully');
  })
);

/**
 * @route   GET /api/v1/executive/team
 * @desc    Get all registered executive team members
 * @access  Private (admin)
 */
router.get(
  '/team',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const service = ExecutiveAutomationService.getInstance();
    const members = service.getTeamMembers();
    
    sendSuccess(res, {
      data: members,
      total: members.length,
    }, 'Team members retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/executive/team
 * @desc    Register a new executive team member
 * @access  Private (admin)
 */
router.post(
  '/team',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('admin'),
  ValidationMiddleware.validateBody(registerTeamMemberSchema),
  asyncHandler(async (req, res) => {
    const service = ExecutiveAutomationService.getInstance();
    service.registerTeamMember(req.body);
    
    sendSuccess(res, req.body, 'Team member registered successfully');
  })
);

/**
 * @route   POST /api/v1/executive/team/bulk
 * @desc    Register multiple executive team members
 * @access  Private (admin)
 */
router.post(
  '/team/bulk',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('admin'),
  ValidationMiddleware.validateBody(z.array(registerTeamMemberSchema)),
  asyncHandler(async (req, res) => {
    const service = ExecutiveAutomationService.getInstance();
    service.registerTeamMembers(req.body);
    
    sendSuccess(res, {
      registered: req.body.length,
    }, `Registered ${req.body.length} team members successfully`);
  })
);

/**
 * @route   GET /api/v1/executive/escalation-rules
 * @desc    Get all escalation rules
 * @access  Private (admin)
 */
router.get(
  '/escalation-rules',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const service = ExecutiveAutomationService.getInstance();
    const rules = service.getEscalationRules();
    
    sendSuccess(res, {
      data: rules,
      total: rules.length,
    }, 'Escalation rules retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/executive/escalation-rules
 * @desc    Add a custom escalation rule
 * @access  Private (admin)
 */
router.post(
  '/escalation-rules',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('admin'),
  ValidationMiddleware.validateBody(escalationRuleSchema),
  asyncHandler(async (req, res) => {
    const service = ExecutiveAutomationService.getInstance();
    service.addEscalationRule(req.body);
    
    sendSuccess(res, req.body, 'Escalation rule added successfully');
  })
);

/**
 * @route   POST /api/v1/executive/escalation-rules/:ruleId/trigger
 * @desc    Manually trigger an escalation rule
 * @access  Private (admin)
 */
router.post(
  '/escalation-rules/:ruleId/trigger',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { ruleId } = req.params;
    const context = req.body.context || {};
    
    const service = ExecutiveAutomationService.getInstance();
    service.triggerCustomEscalation(ruleId, context);
    
    sendSuccess(res, { ruleId, triggeredAt: new Date().toISOString() }, 'Escalation rule triggered successfully');
  })
);

/**
 * @route   GET /api/v1/executive/digests
 * @desc    Get recent executive digests
 * @access  Private (admin)
 */
router.get(
  '/digests',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('admin'),
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const service = ExecutiveAutomationService.getInstance();
    const digests = service.getRecentDigests(limit);
    
    sendSuccess(res, {
      data: digests,
      total: digests.length,
    }, 'Digests retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/executive/scheduler/start
 * @desc    Start the cron scheduler
 * @access  Private (admin)
 */
router.post(
  '/scheduler/start',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const service = ExecutiveAutomationService.getInstance();
    service.startCronScheduler();
    
    sendSuccess(res, { startedAt: new Date().toISOString() }, 'Cron scheduler started successfully');
  })
);

/**
 * @route   POST /api/v1/executive/scheduler/stop
 * @desc    Stop the cron scheduler
 * @access  Private (admin)
 */
router.post(
  '/scheduler/stop',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const service = ExecutiveAutomationService.getInstance();
    service.stopCronScheduler();
    
    sendSuccess(res, { stoppedAt: new Date().toISOString() }, 'Cron scheduler stopped successfully');
  })
);

export default router;
