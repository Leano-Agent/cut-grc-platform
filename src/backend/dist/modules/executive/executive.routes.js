"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeExecutiveRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const errorMiddleware_1 = require("../../middleware/errorMiddleware");
const executive_automation_service_1 = __importDefault(require("../../services/executive-automation.service"));
const logger_1 = __importDefault(require("../../config/logger"));
const router = (0, express_1.Router)();
let authMiddleware;
const initializeExecutiveRoutes = (redisClient) => {
    authMiddleware = new auth_middleware_1.AuthMiddleware(redisClient);
};
exports.initializeExecutiveRoutes = initializeExecutiveRoutes;
const registerTeamMemberSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    role: zod_1.z.enum([
        'risk_owner', 'department_head', 'executive_director',
        'chief_risk_officer', 'ceo', 'board_member',
        'audit_committee', 'compliance_committee',
    ]),
    department: zod_1.z.string().min(1),
    escalationOrder: zod_1.z.number().int().positive(),
});
const escalationRuleSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().min(1),
    trigger: zod_1.z.enum([
        'sla_breach', 'approval_pending_24h', 'approval_pending_48h',
        'approval_pending_7d', 'risk_threshold_exceeded',
        'compliance_due', 'control_failure', 'step_rejected',
    ]),
    conditions: zod_1.z.array(zod_1.z.object({
        field: zod_1.z.string(),
        operator: zod_1.z.enum(['eq', 'gt', 'gte', 'lt', 'lte', 'in', 'contains']),
        value: zod_1.z.any(),
    })),
    actions: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['notify', 'escalate_to', 'pause_workflow', 'create_task', 'send_email', 'generate_report']),
        target: zod_1.z.string(),
        message: zod_1.z.string(),
        priority: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
    })),
    isActive: zod_1.z.boolean().default(true),
});
const updateCronJobSchema = zod_1.z.object({
    isActive: zod_1.z.boolean().optional(),
    schedule: zod_1.z.string().optional(),
});
router.get('/cron-jobs', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (req, res, next) => authMiddleware ? authMiddleware.requireRole('admin')(req, res, next) : next(), (0, errorMiddleware_1.asyncHandler)(async (_req, res) => {
    const service = executive_automation_service_1.default.getInstance();
    const jobs = service.getCronJobs();
    (0, errorMiddleware_1.sendSuccess)(res, {
        data: jobs,
        total: jobs.length,
    }, 'Cron jobs retrieved successfully');
}));
router.patch('/cron-jobs/:jobId', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (req, res, next) => authMiddleware ? authMiddleware.requireRole('admin')(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateBody(updateCronJobSchema), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { jobId } = req.params;
    const updates = req.body;
    const service = executive_automation_service_1.default.getInstance();
    if (updates.isActive !== undefined) {
        service.toggleCronJob(jobId, updates.isActive);
    }
    if (updates.schedule) {
        service.updateCronJob(jobId, updates);
    }
    (0, errorMiddleware_1.sendSuccess)(res, null, `Cron job ${jobId} updated successfully`);
}));
router.post('/cron-jobs/:jobId/trigger', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (req, res, next) => authMiddleware ? authMiddleware.requireRole('admin')(req, res, next) : next(), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { jobId } = req.params;
    const service = executive_automation_service_1.default.getInstance();
    const jobs = service.getCronJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
        return (0, errorMiddleware_1.sendError)(res, 404, 'Cron job not found');
    }
    logger_1.default.info(`Manual trigger of cron job: ${job.name}`);
    (0, errorMiddleware_1.sendSuccess)(res, { jobId, jobName: job.name, triggeredAt: new Date().toISOString() }, 'Cron job triggered successfully');
}));
router.get('/team', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (req, res, next) => authMiddleware ? authMiddleware.requireRole('admin')(req, res, next) : next(), (0, errorMiddleware_1.asyncHandler)(async (_req, res) => {
    const service = executive_automation_service_1.default.getInstance();
    const members = service.getTeamMembers();
    (0, errorMiddleware_1.sendSuccess)(res, {
        data: members,
        total: members.length,
    }, 'Team members retrieved successfully');
}));
router.post('/team', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (req, res, next) => authMiddleware ? authMiddleware.requireRole('admin')(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateBody(registerTeamMemberSchema), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const service = executive_automation_service_1.default.getInstance();
    service.registerTeamMember(req.body);
    (0, errorMiddleware_1.sendSuccess)(res, req.body, 'Team member registered successfully');
}));
router.post('/team/bulk', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (req, res, next) => authMiddleware ? authMiddleware.requireRole('admin')(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateBody(zod_1.z.array(registerTeamMemberSchema)), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const service = executive_automation_service_1.default.getInstance();
    service.registerTeamMembers(req.body);
    (0, errorMiddleware_1.sendSuccess)(res, {
        registered: req.body.length,
    }, `Registered ${req.body.length} team members successfully`);
}));
router.get('/escalation-rules', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (req, res, next) => authMiddleware ? authMiddleware.requireRole('admin')(req, res, next) : next(), (0, errorMiddleware_1.asyncHandler)(async (_req, res) => {
    const service = executive_automation_service_1.default.getInstance();
    const rules = service.getEscalationRules();
    (0, errorMiddleware_1.sendSuccess)(res, {
        data: rules,
        total: rules.length,
    }, 'Escalation rules retrieved successfully');
}));
router.post('/escalation-rules', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (req, res, next) => authMiddleware ? authMiddleware.requireRole('admin')(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateBody(escalationRuleSchema), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const service = executive_automation_service_1.default.getInstance();
    service.addEscalationRule(req.body);
    (0, errorMiddleware_1.sendSuccess)(res, req.body, 'Escalation rule added successfully');
}));
router.post('/escalation-rules/:ruleId/trigger', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (req, res, next) => authMiddleware ? authMiddleware.requireRole('admin')(req, res, next) : next(), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { ruleId } = req.params;
    const context = req.body.context || {};
    const service = executive_automation_service_1.default.getInstance();
    service.triggerCustomEscalation(ruleId, context);
    (0, errorMiddleware_1.sendSuccess)(res, { ruleId, triggeredAt: new Date().toISOString() }, 'Escalation rule triggered successfully');
}));
router.get('/digests', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (req, res, next) => authMiddleware ? authMiddleware.requireRole('admin')(req, res, next) : next(), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const service = executive_automation_service_1.default.getInstance();
    const digests = service.getRecentDigests(limit);
    (0, errorMiddleware_1.sendSuccess)(res, {
        data: digests,
        total: digests.length,
    }, 'Digests retrieved successfully');
}));
router.post('/scheduler/start', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (req, res, next) => authMiddleware ? authMiddleware.requireRole('admin')(req, res, next) : next(), (0, errorMiddleware_1.asyncHandler)(async (_req, res) => {
    const service = executive_automation_service_1.default.getInstance();
    service.startCronScheduler();
    (0, errorMiddleware_1.sendSuccess)(res, { startedAt: new Date().toISOString() }, 'Cron scheduler started successfully');
}));
router.post('/scheduler/stop', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (req, res, next) => authMiddleware ? authMiddleware.requireRole('admin')(req, res, next) : next(), (0, errorMiddleware_1.asyncHandler)(async (_req, res) => {
    const service = executive_automation_service_1.default.getInstance();
    service.stopCronScheduler();
    (0, errorMiddleware_1.sendSuccess)(res, { stoppedAt: new Date().toISOString() }, 'Cron scheduler stopped successfully');
}));
exports.default = router;
//# sourceMappingURL=executive.routes.js.map