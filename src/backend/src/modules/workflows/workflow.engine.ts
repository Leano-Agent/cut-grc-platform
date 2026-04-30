/**
 * Municipal Workflow Engine
 * Core engine for managing municipal workflows
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../config/logger';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'approval' | 'notification' | 'decision';
  role: string; // Role required to perform this step
  assignee?: string; // Specific user assigned
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'escalated';
  actions: string[]; // Available actions for this step
  metadata?: Record<string, any>;
}

export interface WorkflowInstance {
  id: string;
  workflowType: string;
  workflowId: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  currentStep: number;
  steps: WorkflowStep[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  metadata?: Record<string, any>;
  sla?: {
    target: Date;
    warningThreshold: number; // hours before due date to warn
    breachThreshold: number; // hours after due date to escalate
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: number;
  steps: Omit<WorkflowStep, "id" | "assignee">[];
  defaultPriority: 'low' | 'medium' | 'high' | 'critical';
  defaultSla?: {
    duration: number; // hours
    warningThreshold: number;
    breachThreshold: number;
  };
  roles: string[]; // Roles that can initiate this workflow
  metadata?: Record<string, any>;
}

export interface WorkflowAction {
  type: string;
  instanceId: string;
  stepId: string;
  action: string;
  performedBy: string;
  performedAt: Date;
  comments?: string;
  metadata?: Record<string, any>;
}

export class WorkflowEngine extends EventEmitter {
  private workflows: Map<string, WorkflowTemplate> = new Map();
  private instances: Map<string, WorkflowInstance> = new Map();
  private actions: WorkflowAction[] = [];

  constructor() {
    super();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.on('workflow.created', (instance: WorkflowInstance) => {
      logger.info(`Workflow created: ${instance.id} - ${instance.title}`);
    });

    this.on('workflow.step.completed', (instance: WorkflowInstance, step: WorkflowStep) => {
      logger.info(`Step completed: ${step.name} in workflow ${instance.id}`);
    });

    this.on('workflow.completed', (instance: WorkflowInstance) => {
      logger.info(`Workflow completed: ${instance.id} - ${instance.title}`);
    });

    this.on('workflow.escalated', (instance: WorkflowInstance, step: WorkflowStep) => {
      logger.warn(`Workflow escalated: ${instance.id} at step ${step.name}`);
    });

    this.on('sla.breached', (instance: WorkflowInstance) => {
      logger.error(`SLA breached for workflow: ${instance.id}`);
    });
  }

  /**
   * Register a workflow template
   */
  registerTemplate(template: WorkflowTemplate): void {
    this.workflows.set(template.id, template);
    logger.info(`Workflow template registered: ${template.name} v${template.version}`);
  }

  /**
   * Create a new workflow instance from template
   */
  createInstance(
    workflowId: string,
    title: string,
    createdBy: string,
    metadata?: Record<string, any>
  ): WorkflowInstance {
    const template = this.workflows.get(workflowId);
    if (!template) {
      throw new Error(`Workflow template not found: ${workflowId}`);
    }

    const now = new Date();
    const dueDate = metadata?.dueDate 
      ? new Date(metadata.dueDate)
      : template.defaultSla 
        ? new Date(now.getTime() + template.defaultSla.duration * 60 * 60 * 1000)
        : undefined;

    const instance: WorkflowInstance = {
      id: uuidv4(),
      workflowType: template.category,
      workflowId,
      title,
      description: metadata?.description,
      status: 'active',
      priority: metadata?.priority || template.defaultPriority,
      currentStep: 0,
      steps: template.steps.map((step, index) => ({
        ...step,
        id: uuidv4(),
        status: index === 0 ? 'pending' : 'pending',
        assignee: (step as any).assignee,
      })),
      createdBy,
      createdAt: now,
      updatedAt: now,
      dueDate,
      metadata,
      sla: dueDate && template.defaultSla ? {
        target: dueDate,
        warningThreshold: template.defaultSla.warningThreshold,
        breachThreshold: template.defaultSla.breachThreshold,
      } : undefined,
    };

    // Activate first step
    if (instance.steps.length > 0) {
      instance.steps[0].status = 'pending';
    }

    this.instances.set(instance.id, instance);
    this.emit('workflow.created', instance);
    
    return instance;
  }

  /**
   * Get workflow instance by ID
   */
  getInstance(instanceId: string): WorkflowInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Get all instances for a user
   */
  getUserInstances(userId: string, role: string): WorkflowInstance[] {
    return Array.from(this.instances.values()).filter(instance => {
      // User created it
      if (instance.createdBy === userId) return true;
      
      // User is assigned to current step
      const currentStep = instance.steps[instance.currentStep];
      if (currentStep.assignee === userId) return true;
      
      // User has required role for current step
      if (currentStep.role === role) return true;
      
      return false;
    });
  }

  /**
   * Perform an action on a workflow step
   */
  performAction(
    instanceId: string,
    stepId: string,
    action: string,
    performedBy: string,
    comments?: string,
    metadata?: Record<string, any>
  ): WorkflowInstance {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance not found: ${instanceId}`);
    }

    if (instance.status !== 'active') {
      throw new Error(`Workflow is not active: ${instance.status}`);
    }

    const step = instance.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    if (step.status !== 'pending' && step.status !== 'in_progress') {
      throw new Error(`Step is not actionable: ${step.status}`);
    }

    if (!step.actions.includes(action)) {
      throw new Error(`Invalid action for step: ${action}. Allowed: ${step.actions.join(', ')}`);
    }

    // Record the action
    const workflowAction: WorkflowAction = {
      type: instance.workflowType,
      instanceId,
      stepId,
      action,
      performedBy,
      performedAt: new Date(),
      comments,
      metadata,
    };
    this.actions.push(workflowAction);

    // Update step status based on action
    switch (action) {
      case 'approve':
        step.status = 'completed';
        break;
      case 'reject':
        step.status = 'rejected';
        instance.status = 'cancelled';
        break;
      case 'escalate':
        step.status = 'escalated';
        this.emit('workflow.escalated', instance, step);
        break;
      case 'complete':
        step.status = 'completed';
        break;
      default:
        step.status = 'completed';
    }

    instance.updatedAt = new Date();

    // Move to next step if current step completed
    if (step.status === 'completed' && instance.currentStep < instance.steps.length - 1) {
      instance.currentStep++;
      const nextStep = instance.steps[instance.currentStep];
      nextStep.status = 'pending';
      this.emit('workflow.step.completed', instance, step);
    } else if (step.status === 'completed' && instance.currentStep === instance.steps.length - 1) {
      // All steps completed
      instance.status = 'completed';
      this.emit('workflow.completed', instance);
    }

    // Check SLA
    this.checkSLA(instance);

    return instance;
  }

  /**
   * Check SLA status for workflow instance
   */
  private checkSLA(instance: WorkflowInstance): void {
    if (!instance.sla || !instance.dueDate) return;

    const now = new Date();
    const timeRemaining = instance.dueDate.getTime() - now.getTime();
    const hoursRemaining = timeRemaining / (1000 * 60 * 60);

    if (hoursRemaining < 0) {
      // SLA breached
      this.emit('sla.breached', instance);
    } else if (hoursRemaining < instance.sla.warningThreshold) {
      // Warning threshold approaching
      this.emit('sla.warning', instance, hoursRemaining);
    }
  }

  /**
   * Get workflow actions for an instance
   */
  getInstanceActions(instanceId: string): WorkflowAction[] {
    return this.actions.filter(action => action.instanceId === instanceId);
  }

  /**
   * Get overdue workflows
   */
  getOverdueWorkflows(): WorkflowInstance[] {
    const now = new Date();
    return Array.from(this.instances.values()).filter(instance => {
      if (!instance.dueDate || instance.status === 'completed' || instance.status === 'cancelled') {
        return false;
      }
      return instance.dueDate < now;
    });
  }

  /**
   * Get workflows requiring attention
   */
  getWorkflowsRequiringAttention(role: string): WorkflowInstance[] {
    return Array.from(this.instances.values()).filter(instance => {
      if (instance.status !== 'active') return false;
      
      const currentStep = instance.steps[instance.currentStep];
      return currentStep.role === role && currentStep.status === 'pending';
    });
  }

  /**
   * Update workflow instance metadata
   */
  updateMetadata(instanceId: string, metadata: Record<string, any>): WorkflowInstance {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance not found: ${instanceId}`);
    }

    instance.metadata = { ...instance.metadata, ...metadata };
    instance.updatedAt = new Date();
    
    return instance;
  }

  /**
   * Pause a workflow instance
   */
  pauseInstance(instanceId: string): WorkflowInstance {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance not found: ${instanceId}`);
    }

    if (instance.status !== 'active') {
      throw new Error(`Cannot pause workflow in status: ${instance.status}`);
    }

    instance.status = 'paused';
    instance.updatedAt = new Date();
    
    return instance;
  }

  /**
   * Resume a paused workflow instance
   */
  resumeInstance(instanceId: string): WorkflowInstance {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance not found: ${instanceId}`);
    }

    if (instance.status !== 'paused') {
      throw new Error(`Cannot resume workflow in status: ${instance.status}`);
    }

    instance.status = 'active';
    instance.updatedAt = new Date();
    
    return instance;
  }

  /**
   * Cancel a workflow instance
   */
  cancelInstance(instanceId: string, reason?: string): WorkflowInstance {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance not found: ${instanceId}`);
    }

    instance.status = 'cancelled';
    instance.updatedAt = new Date();
    
    if (reason) {
      this.actions.push({
        type: instance.workflowType,
        instanceId,
        stepId: 'system',
        action: 'cancel',
        performedBy: 'system',
        performedAt: new Date(),
        comments: reason,
      });
    }
    
    return instance;
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine();