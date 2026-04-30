/**
 * Municipal Workflows API Routes
 * REST API endpoints for municipal workflow management
 */

import { Router } from 'express';
import { z } from 'zod';
import { workflowEngine } from '../workflows/workflow.engine';
import { 
  MUNICIPAL_WORKFLOW_TEMPLATES, 
  MUNICIPAL_ROLES,
  WORKFLOW_CATEGORIES,
  initializeMunicipalWorkflows 
} from './workflow.templates';
import { ValidationMiddleware } from '../../middleware/validation.middleware';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendError } from '../../middleware/errorMiddleware';
import logger from '../../config/logger';

const router = Router();

// Initialize municipal workflows
initializeMunicipalWorkflows(workflowEngine);

// Validation schemas
const createWorkflowSchema = z.object({
  workflowId: z.string().min(1 as any, 'Workflow ID is required'),
  title: z.string().min(1 as any, 'Title is required').max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  metadata: z.record(z.any()).optional(),
});

const performActionSchema = z.object({
  action: z.string().min(1 as any, 'Action is required'),
  comments: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateMetadataSchema = z.object({
  metadata: z.record(z.any()).min(1 as any, 'Metadata is required'),
});

const filterWorkflowsSchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

// Middleware to check if user has municipal role
const requireMunicipalRole = (requiredRole: string) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', 'NO_AUTH');
      return;
    }

    // Check if user has the required role
    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      sendError(res, 403, `Insufficient permissions. Required role: ${requiredRole}`, 'INSUFFICIENT_PERMISSIONS');
      return;
    }

    next();
  };
};

/**
 * @route   GET /api/v1/municipal/workflows/templates
 * @desc    Get all municipal workflow templates
 * @access  Private (Municipal roles)
 */
router.get(
  '/workflows/templates',
  (AuthMiddleware as any).verifyToken,
  asyncHandler(async (req, res) => {
    sendSuccess(res, {
      templates: MUNICIPAL_WORKFLOW_TEMPLATES,
      roles: MUNICIPAL_ROLES,
      categories: WORKFLOW_CATEGORIES,
    }, 'Workflow templates retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/municipal/workflows/templates/:workflowId
 * @desc    Get specific workflow template
 * @access  Private (Municipal roles)
 */
router.get(
  '/workflows/templates/:workflowId',
  (AuthMiddleware as any).verifyToken,
  asyncHandler(async (req, res) => {
    const { workflowId } = req.params;
    const template = MUNICIPAL_WORKFLOW_TEMPLATES[workflowId];
    
    if (!template) {
      sendError(res, 404, 'Workflow template not found', 'TEMPLATE_NOT_FOUND');
      return;
    }
    
    sendSuccess(res, template, 'Workflow template retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/municipal/workflows/instances
 * @desc    Create new workflow instance
 * @access  Private (Municipal roles)
 */
router.post(
  '/workflows/instances',
  (AuthMiddleware as any).verifyToken,
  ValidationMiddleware.validateBody(createWorkflowSchema),
  asyncHandler(async (req, res) => {
    const { workflowId, title, description, priority, metadata } = req.body;
    
    // Check if template exists
    if (!MUNICIPAL_WORKFLOW_TEMPLATES[workflowId]) {
      sendError(res, 404, 'Workflow template not found', 'TEMPLATE_NOT_FOUND');
      return;
    }
    
    // Check if user has required role to initiate this workflow
    const template = MUNICIPAL_WORKFLOW_TEMPLATES[workflowId];
    if (!template.roles.includes(req.user.role) && req.user.role !== 'admin') {
      sendError(res, 403, 'Insufficient permissions to initiate this workflow', 'INSUFFICIENT_PERMISSIONS');
      return;
    }
    
    // Create workflow instance
    const instance = workflowEngine.createInstance(
      workflowId,
      title,
      req.user.userId,
      {
        ...metadata,
        description,
        priority,
        initiatedBy: req.user.email,
        userRole: req.user.role,
      }
    );
    
    logger.info(`Municipal workflow created: ${instance.id} by ${req.user.email}`);
    
    sendSuccess(res, instance, 'Workflow instance created successfully', 201);
  })
);

/**
 * @route   GET /api/v1/municipal/workflows/instances
 * @desc    Get workflow instances for current user
 * @access  Private (Municipal roles)
 */
router.get(
  '/workflows/instances',
  (AuthMiddleware as any).verifyToken,
  ValidationMiddleware.validateQuery(filterWorkflowsSchema),
  asyncHandler(async (req, res) => {
    const { status, category, priority, dateFrom, dateTo, limit, offset } = req.query;
    
    // Get user's workflows
    const allInstances = workflowEngine.getUserInstances(req.user.userId, req.user.role);
    
    // Apply filters
    let filteredInstances = allInstances;
    
    if (status) {
      filteredInstances = filteredInstances.filter(instance => instance.status === status);
    }
    
    if (category) {
      filteredInstances = filteredInstances.filter(instance => instance.workflowType === category);
    }
    
    if (priority) {
      filteredInstances = filteredInstances.filter(instance => instance.priority === priority);
    }
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom as string);
      filteredInstances = filteredInstances.filter(instance => instance.createdAt >= fromDate);
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo as string);
      filteredInstances = filteredInstances.filter(instance => instance.createdAt <= toDate);
    }
    
    // Apply pagination
    const total = filteredInstances.length;
    const paginatedInstances = filteredInstances.slice(
      offset as number,
      (offset as number) + (limit as number)
    );
    
    sendSuccess(res, {
      instances: paginatedInstances,
      pagination: {
        total,
        limit: limit as number,
        offset: offset as number,
        hasMore: (offset as number) + (limit as number) < total,
      },
    }, 'Workflow instances retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/municipal/workflows/instances/:instanceId
 * @desc    Get workflow instance details
 * @access  Private (Municipal roles)
 */
router.get(
  '/workflows/instances/:instanceId',
  (AuthMiddleware as any).verifyToken,
  asyncHandler(async (req, res) => {
    const { instanceId } = req.params;
    const instance = workflowEngine.getInstance(instanceId);
    
    if (!instance) {
      sendError(res, 404, 'Workflow instance not found', 'INSTANCE_NOT_FOUND');
      return;
    }
    
    // Check permissions
    if (
      instance.createdBy !== req.user.userId &&
      !instance.steps[instance.currentStep].role.includes(req.user.role) &&
      req.user.role !== 'admin'
    ) {
      sendError(res, 403, 'Access denied to this workflow instance', 'ACCESS_DENIED');
      return;
    }
    
    // Get actions for this instance
    const actions = workflowEngine.getInstanceActions(instanceId);
    
    sendSuccess(res, {
      instance,
      actions,
      currentStep: instance.steps[instance.currentStep],
      template: MUNICIPAL_WORKFLOW_TEMPLATES[instance.workflowId],
    }, 'Workflow instance details retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/municipal/workflows/instances/:instanceId/actions/:stepId
 * @desc    Perform action on workflow step
 * @access  Private (Municipal roles)
 */
router.post(
  '/workflows/instances/:instanceId/actions/:stepId',
  (AuthMiddleware as any).verifyToken,
  ValidationMiddleware.validateBody(performActionSchema),
  asyncHandler(async (req, res) => {
    const { instanceId, stepId } = req.params;
    const { action, comments, metadata } = req.body;
    
    const instance = workflowEngine.getInstance(instanceId);
    if (!instance) {
      sendError(res, 404, 'Workflow instance not found', 'INSTANCE_NOT_FOUND');
      return;
    }
    
    // Check if user can perform action on this step
    const currentStep = instance.steps[instance.currentStep];
    if (currentStep.id !== stepId) {
      sendError(res, 400, 'Cannot perform action on this step', 'INVALID_STEP');
      return;
    }
    
    if (currentStep.role !== req.user.role && req.user.role !== 'admin') {
      sendError(res, 403, 'Insufficient permissions to perform this action', 'INSUFFICIENT_PERMISSIONS');
      return;
    }
    
    // Perform the action
    try {
      const updatedInstance = workflowEngine.performAction(
        instanceId,
        stepId,
        action,
        req.user.userId,
        comments,
        {
          ...metadata,
          performedByEmail: req.user.email,
          performedByRole: req.user.role,
        }
      );
      
      logger.info(`Workflow action performed: ${action} on ${instanceId} by ${req.user.email}`);
      
      sendSuccess(res, updatedInstance, 'Action performed successfully');
    } catch (error: any) {
      sendError(res, 400, error.message, 'ACTION_FAILED');
    }
  })
);

/**
 * @route   GET /api/v1/municipal/workflows/dashboard
 * @desc    Get municipal workflow dashboard
 * @access  Private (Municipal roles)
 */
router.get(
  '/workflows/dashboard',
  (AuthMiddleware as any).verifyToken,
  asyncHandler(async (req, res) => {
    const allInstances = workflowEngine.getUserInstances(req.user.userId, req.user.role);
    
    // Dashboard statistics
    const stats = {
      total: allInstances.length,
      active: allInstances.filter(i => i.status === 'active').length,
      completed: allInstances.filter(i => i.status === 'completed').length,
      overdue: workflowEngine.getOverdueWorkflows().length,
      pendingAction: workflowEngine.getWorkflowsRequiringAttention(req.user.role).length,
    };
    
    // Recent activities
    const recentInstances = allInstances
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10);
    
    // Workflows requiring attention
    const attentionRequired = workflowEngine.getWorkflowsRequiringAttention(req.user.role);
    
    // Overdue workflows
    const overdue = workflowEngine.getOverdueWorkflows();
    
    sendSuccess(res, {
      stats,
      recentInstances,
      attentionRequired,
      overdue,
      userRole: req.user.role,
    }, 'Workflow dashboard retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/municipal/workflows/overdue
 * @desc    Get overdue workflows
 * @access  Private (Municipal roles)
 */
router.get(
  '/workflows/overdue',
  (AuthMiddleware as any).verifyToken,
  asyncHandler(async (req, res) => {
    const overdue = workflowEngine.getOverdueWorkflows();
    
    // Filter to user's accessible workflows
    const accessibleOverdue = overdue.filter(instance => 
      instance.createdBy === req.user.userId ||
      instance.steps[instance.currentStep].role === req.user.role ||
      req.user.role === 'admin'
    );
    
    sendSuccess(res, accessibleOverdue, 'Overdue workflows retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/municipal/workflows/attention-required
 * @desc    Get workflows requiring user's attention
 * @access  Private (Municipal roles)
 */
router.get(
  '/workflows/attention-required',
  (AuthMiddleware as any).verifyToken,
  asyncHandler(async (req, res) => {
    const attentionRequired = workflowEngine.getWorkflowsRequiringAttention(req.user.role);
    
    sendSuccess(res, attentionRequired, 'Workflows requiring attention retrieved successfully');
  })
);

/**
 * @route   PATCH /api/v1/municipal/workflows/instances/:instanceId/metadata
 * @desc    Update workflow instance metadata
 * @access  Private (Municipal roles)
 */
router.patch(
  '/workflows/instances/:instanceId/metadata',
  (AuthMiddleware as any).verifyToken,
  ValidationMiddleware.validateBody(updateMetadataSchema),
  asyncHandler(async (req, res) => {
    const { instanceId } = req.params;
    const { metadata } = req.body;
    
    const instance = workflowEngine.getInstance(instanceId);
    if (!instance) {
      sendError(res, 404, 'Workflow instance not found', 'INSTANCE_NOT_FOUND');
      return;
    }
    
    // Check permissions - only creator or admin can update metadata
    if (instance.createdBy !== req.user.userId && req.user.role !== 'admin') {
      sendError(res, 403, 'Insufficient permissions to update metadata', 'INSUFFICIENT_PERMISSIONS');
      return;
    }
    
    const updatedInstance = workflowEngine.updateMetadata(instanceId, metadata);
    
    sendSuccess(res, updatedInstance, 'Workflow metadata updated successfully');
  })
);

/**
 * @route   POST /api/v1/municipal/workflows/instances/:instanceId/pause
 * @desc    Pause workflow instance
 * @access  Private (Municipal roles)
 */
router.post(
  '/workflows/instances/:instanceId/pause',
  (AuthMiddleware as any).verifyToken,
  asyncHandler(async (req, res) => {
    const { instanceId } = req.params;
    
    const instance = workflowEngine.getInstance(instanceId);
    if (!instance) {
      sendError(res, 404, 'Workflow instance not found', 'INSTANCE_NOT_FOUND');
      return;
    }
    
    // Check permissions - only creator or admin can pause
    if (instance.createdBy !== req.user.userId && req.user.role !== 'admin') {
      sendError(res, 403, 'Insufficient permissions to pause workflow', 'INSUFFICIENT_PERMISSIONS');
      return;
    }
    
    const pausedInstance = workflowEngine.pauseInstance(instanceId);
    
    sendSuccess(res, pausedInstance, 'Workflow paused successfully');
  })
);

/**
 * @route   POST /api/v1/municipal/workflows/instances/:instanceId/resume
 * @desc    Resume paused workflow instance
 * @access  Private (Municipal roles)
 */
router.post(
  '/workflows/instances/:instanceId/resume',
  (AuthMiddleware as any).verifyToken,
  asyncHandler(async (req, res) => {
    const { instanceId } = req.params;
    
    const instance = workflowEngine.getInstance(instanceId);
    if (!instance) {
      sendError(res, 404, 'Workflow instance not found', 'INSTANCE_NOT_FOUND');
      return;
    }
    
    // Check permissions - only creator or admin can resume
    if (instance.createdBy !== req.user.userId && req.user.role !== 'admin') {
      sendError(res, 403, 'Insufficient permissions to resume workflow', 'INSUFFICIENT_PERMISSIONS');
      return;
    }
    
    const resumedInstance = workflowEngine.resumeInstance(instanceId);
    
    sendSuccess(res, resumedInstance, 'Workflow resumed successfully');
  })
);

/**
 * @route   POST /api/v1/municipal/workflows/instances/:instanceId/cancel
 * @desc    Cancel workflow instance
 * @access  Private (Municipal roles)
 */
router.post(
  '/workflows/instances/:instanceId/cancel',
  (AuthMiddleware as any).verifyToken,
  ValidationMiddleware.validateBody(z.object({ reason: z.string().optional() })),
  asyncHandler(async (req, res) => {
    const { instanceId } = req.params;
    const { reason } = req.body;
    
    const instance = workflowEngine.getInstance(instanceId);
    if (!instance) {
      sendError(res, 404, 'Workflow instance not found', 'INSTANCE_NOT_FOUND');
      return;
    }
    
    // Check permissions - only creator or admin can cancel
    if (instance.createdBy !== req.user.userId && req.user.role !== 'admin') {
      sendError(res, 403, 'Insufficient permissions to cancel workflow', 'INSUFFICIENT_PERMISSIONS');
      return;
    }
    
    const cancelledInstance = workflowEngine.cancelInstance(instanceId, reason);
    
    sendSuccess(res, cancelledInstance, 'Workflow cancelled successfully');
  })
);

/**
 * @route   GET /api/v1/municipal/workflows/instances/:instanceId/actions
 * @desc    Get actions history for workflow instance
 * @access  Private (Municipal roles)
 */
router.get(
  '/workflows/instances/:instanceId/actions',
  (AuthMiddleware as any).verifyToken,
  asyncHandler(async (req, res) => {
    const { instanceId } = req.params;
    
    const instance = workflowEngine.getInstance(instanceId);
    if (!instance) {
      sendError(res, 404, 'Workflow instance not found', 'INSTANCE_NOT_FOUND');
      return;
    }
    
    // Check permissions
    if (
      instance.createdBy !== req.user.userId &&
      !instance.steps[instance.currentStep].role.includes(req.user.role) &&
      req.user.role !== 'admin'
    ) {
      sendError(res, 403, 'Access denied to this workflow instance', 'ACCESS_DENIED');
      return;
    }
    
    const actions = workflowEngine.getInstanceActions(instanceId);
    
    sendSuccess(res, actions, 'Workflow actions retrieved successfully');
  })
);