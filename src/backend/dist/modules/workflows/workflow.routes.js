"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWorkflowRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const errorMiddleware_1 = require("../../middleware/errorMiddleware");
const logger_1 = __importDefault(require("../../config/logger"));
const router = (0, express_1.Router)();
const createWorkflowSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Workflow name is required').max(100),
    description: zod_1.z.string().max(500).optional(),
    type: zod_1.z.enum(['document_approval', 'risk_assessment', 'compliance_check', 'purchase_approval']),
    steps: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1),
        role: zod_1.z.string().min(1),
        action: zod_1.z.enum(['review', 'approve', 'sign', 'verify']),
        order: zod_1.z.number().int().positive(),
        timeoutDays: zod_1.z.number().int().positive().optional(),
    })).min(1, 'At least one step is required'),
    department: zod_1.z.string().min(1, 'Department is required'),
});
const updateWorkflowStatusSchema = zod_1.z.object({
    action: zod_1.z.enum(['approve', 'reject', 'return', 'escalate']),
    comments: zod_1.z.string().max(1000).optional(),
});
let authMiddleware;
const initializeWorkflowRoutes = (redisClient) => {
    authMiddleware = new auth_middleware_1.AuthMiddleware(redisClient);
};
exports.initializeWorkflowRoutes = initializeWorkflowRoutes;
router.get('/', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const workflows = [
        {
            id: 'wf_1',
            name: 'Document Approval Workflow',
            description: 'Standard workflow for municipal document approval',
            type: 'document_approval',
            department: 'All',
            status: 'active',
            steps: [
                { id: 'step_1', name: 'Department Review', role: 'manager', action: 'review', order: 1, estimatedDays: 3 },
                { id: 'step_2', name: 'Legal Review', role: 'legal', action: 'review', order: 2, estimatedDays: 5 },
                { id: 'step_3', name: 'Executive Approval', role: 'director', action: 'approve', order: 3, estimatedDays: 2 },
            ],
            createdAt: '2024-01-01T00:00:00Z',
            createdBy: 'user_1',
            activeInstances: 12,
            completedInstances: 45,
            averageCompletionTime: '14 days'
        },
        {
            id: 'wf_2',
            name: 'Risk Assessment Workflow',
            description: 'Workflow for risk identification and mitigation',
            type: 'risk_assessment',
            department: 'Risk Management',
            status: 'active',
            steps: [
                { id: 'step_1', name: 'Risk Identification', role: 'analyst', action: 'review', order: 1, estimatedDays: 2 },
                { id: 'step_2', name: 'Impact Assessment', role: 'manager', action: 'review', order: 2, estimatedDays: 3 },
                { id: 'step_3', name: 'Mitigation Planning', role: 'director', action: 'approve', order: 3, estimatedDays: 5 },
            ],
            createdAt: '2024-01-10T00:00:00Z',
            createdBy: 'user_2',
            activeInstances: 8,
            completedInstances: 23,
            averageCompletionTime: '10 days'
        }
    ];
    (0, errorMiddleware_1.sendSuccess)(res, workflows, 'Workflows retrieved successfully');
}));
router.get('/:id', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateParams(zod_1.z.object({ id: zod_1.z.string() })), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const workflow = {
        id,
        name: 'Document Approval Workflow',
        description: 'Standard workflow for municipal document approval with detailed steps and requirements',
        type: 'document_approval',
        department: 'All',
        status: 'active',
        version: '2.1',
        steps: [
            {
                id: 'step_1',
                name: 'Department Review',
                description: 'Initial review by department manager',
                role: 'manager',
                action: 'review',
                order: 1,
                estimatedDays: 3,
                requiredFields: ['department_comments', 'recommendation'],
                canEscalate: true,
                escalationRole: 'director'
            },
            {
                id: 'step_2',
                name: 'Legal Review',
                description: 'Legal compliance check',
                role: 'legal',
                action: 'review',
                order: 2,
                estimatedDays: 5,
                requiredFields: ['legal_comments', 'compliance_status'],
                canEscalate: false
            },
            {
                id: 'step_3',
                name: 'Executive Approval',
                description: 'Final approval by department director',
                role: 'director',
                action: 'approve',
                order: 3,
                estimatedDays: 2,
                requiredFields: ['approval_comments', 'effective_date'],
                canEscalate: true,
                escalationRole: 'ceo'
            }
        ],
        conditions: [
            {
                condition: 'If legal review rejects',
                action: 'Return to department for revision',
                targetStep: 'step_1'
            },
            {
                condition: 'If department is "Finance"',
                action: 'Add financial review step',
                additionalStep: 'financial_review'
            }
        ],
        notifications: {
            email: true,
            inApp: true,
            sms: false,
            reminderFrequency: 'daily'
        },
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: {
            id: 'user_1',
            name: 'Admin User',
            email: 'admin@municipal.gov'
        },
        updatedAt: '2024-01-15T10:30:00Z',
        statistics: {
            activeInstances: 12,
            completedInstances: 45,
            averageCompletionTime: '14 days',
            successRate: '92%',
            mostCommonDepartment: 'Planning',
            bottleneckStep: 'step_2'
        },
        permissions: {
            canEdit: true,
            canDelete: false,
            canActivate: true,
            canArchive: true
        }
    };
    (0, errorMiddleware_1.sendSuccess)(res, workflow, 'Workflow retrieved successfully');
}));
router.post('/', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (req, res, next) => authMiddleware ? authMiddleware.requireRole(['admin', 'manager'])(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateBody(createWorkflowSchema), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        (0, errorMiddleware_1.sendError)(res, 401, 'Authentication required', 'NO_AUTH');
        return;
    }
    const workflowData = req.body;
    const newWorkflow = {
        id: `wf_${Date.now()}`,
        ...workflowData,
        status: 'draft',
        version: '1.0',
        createdBy: {
            id: req.user.userId,
            name: 'Current User',
            email: req.user.email
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activeInstances: 0,
        completedInstances: 0,
        permissions: {
            canEdit: true,
            canDelete: true,
            canActivate: req.user.role === 'admin',
            canArchive: req.user.role === 'admin'
        }
    };
    logger_1.default.info(`Workflow created: ${newWorkflow.id} by ${req.user.userId}`);
    const io = req.app.get('io');
    if (io) {
        io.emit('workflow:created', {
            workflowId: newWorkflow.id,
            name: newWorkflow.name,
            createdBy: req.user.userId,
            timestamp: new Date().toISOString()
        });
    }
    (0, errorMiddleware_1.sendSuccess)(res, newWorkflow, 'Workflow created successfully', 201);
}));
router.get('/:id/instances', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateParams(zod_1.z.object({ id: zod_1.z.string() })), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const instances = [
        {
            id: 'instance_1',
            workflowId: id,
            documentId: 'doc_123',
            documentTitle: 'Urban Development Policy',
            currentStep: 'step_2',
            status: 'in_progress',
            startedBy: 'user_3',
            startedAt: '2024-01-18T09:00:00Z',
            currentAssignee: 'user_4',
            dueDate: '2024-01-25',
            overdue: false,
            priority: 'high'
        },
        {
            id: 'instance_2',
            workflowId: id,
            documentId: 'doc_456',
            documentTitle: 'Budget Allocation Report',
            currentStep: 'step_3',
            status: 'pending',
            startedBy: 'user_5',
            startedAt: '2024-01-20T14:30:00Z',
            currentAssignee: 'user_1',
            dueDate: '2024-01-27',
            overdue: false,
            priority: 'medium'
        }
    ];
    (0, errorMiddleware_1.sendSuccess)(res, {
        workflowId: id,
        instances,
        total: instances.length,
        stats: {
            pending: 1,
            inProgress: 1,
            completed: 0,
            overdue: 0
        }
    }, 'Workflow instances retrieved successfully');
}));
router.post('/:id/instances/:instanceId/action', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), validation_middleware_1.ValidationMiddleware.validateParams(zod_1.z.object({
    id: zod_1.z.string(),
    instanceId: zod_1.z.string()
})), validation_middleware_1.ValidationMiddleware.validateBody(updateWorkflowStatusSchema), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        (0, errorMiddleware_1.sendError)(res, 401, 'Authentication required', 'NO_AUTH');
        return;
    }
    const { id, instanceId } = req.params;
    const { action, comments } = req.body;
    logger_1.default.info(`Workflow action: ${action} on instance ${instanceId} by ${req.user.userId}`);
    const result = {
        instanceId,
        workflowId: id,
        action,
        performedBy: {
            id: req.user.userId,
            name: 'Current User',
            email: req.user.email
        },
        performedAt: new Date().toISOString(),
        comments,
        nextStep: action === 'approve' ? 'step_3' : 'step_1',
        nextAssignee: action === 'approve' ? 'user_1' : 'user_3',
        notificationsSent: true
    };
    const io = req.app.get('io');
    if (io) {
        io.emit('workflow:action', {
            instanceId,
            workflowId: id,
            action,
            performedBy: req.user.userId,
            timestamp: new Date().toISOString()
        });
    }
    (0, errorMiddleware_1.sendSuccess)(res, result, 'Workflow action completed successfully');
}));
router.get('/my-tasks', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        (0, errorMiddleware_1.sendError)(res, 401, 'Authentication required', 'NO_AUTH');
        return;
    }
    const tasks = [
        {
            id: 'task_1',
            instanceId: 'instance_1',
            workflowId: 'wf_1',
            workflowName: 'Document Approval Workflow',
            stepName: 'Department Review',
            stepOrder: 1,
            documentId: 'doc_123',
            documentTitle: 'Urban Development Policy',
            department: 'Planning',
            priority: 'high',
            dueDate: '2024-01-25',
            daysRemaining: 3,
            overdue: false,
            createdAt: '2024-01-18T09:00:00Z'
        },
        {
            id: 'task_2',
            instanceId: 'instance_3',
            workflowId: 'wf_2',
            workflowName: 'Risk Assessment Workflow',
            stepName: 'Impact Assessment',
            stepOrder: 2,
            documentId: 'doc_789',
            documentTitle: 'Security Risk Assessment',
            department: 'IT',
            priority: 'medium',
            dueDate: '2024-01-30',
            daysRemaining: 8,
            overdue: false,
            createdAt: '2024-01-19T11:30:00Z'
        }
    ];
    (0, errorMiddleware_1.sendSuccess)(res, {
        userId: req.user.userId,
        tasks,
        total: tasks.length,
        stats: {
            pending: tasks.length,
            overdue: 0,
            highPriority: 1,
            dueThisWeek: 1
        }
    }, 'User tasks retrieved successfully');
}));
exports.default = router;
//# sourceMappingURL=workflow.routes.js.map