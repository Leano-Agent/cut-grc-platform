"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowEngine = exports.WorkflowEngine = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../../config/logger"));
class WorkflowEngine extends events_1.EventEmitter {
    workflows = new Map();
    instances = new Map();
    actions = [];
    constructor() {
        super();
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.on('workflow.created', (instance) => {
            logger_1.default.info(`Workflow created: ${instance.id} - ${instance.title}`);
        });
        this.on('workflow.step.completed', (instance, step) => {
            logger_1.default.info(`Step completed: ${step.name} in workflow ${instance.id}`);
        });
        this.on('workflow.completed', (instance) => {
            logger_1.default.info(`Workflow completed: ${instance.id} - ${instance.title}`);
        });
        this.on('workflow.escalated', (instance, step) => {
            logger_1.default.warn(`Workflow escalated: ${instance.id} at step ${step.name}`);
        });
        this.on('sla.breached', (instance) => {
            logger_1.default.error(`SLA breached for workflow: ${instance.id}`);
        });
    }
    registerTemplate(template) {
        this.workflows.set(template.id, template);
        logger_1.default.info(`Workflow template registered: ${template.name} v${template.version}`);
    }
    createInstance(workflowId, title, createdBy, metadata) {
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
        const instance = {
            id: (0, uuid_1.v4)(),
            workflowType: template.category,
            workflowId,
            title,
            description: metadata?.description,
            status: 'active',
            priority: metadata?.priority || template.defaultPriority,
            currentStep: 0,
            steps: template.steps.map((step, index) => ({
                ...step,
                id: (0, uuid_1.v4)(),
                status: index === 0 ? 'pending' : 'pending',
                assignee: step.assignee,
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
        if (instance.steps.length > 0) {
            instance.steps[0].status = 'pending';
        }
        this.instances.set(instance.id, instance);
        this.emit('workflow.created', instance);
        return instance;
    }
    getInstance(instanceId) {
        return this.instances.get(instanceId);
    }
    getUserInstances(userId, role) {
        return Array.from(this.instances.values()).filter(instance => {
            if (instance.createdBy === userId)
                return true;
            const currentStep = instance.steps[instance.currentStep];
            if (currentStep.assignee === userId)
                return true;
            if (currentStep.role === role)
                return true;
            return false;
        });
    }
    performAction(instanceId, stepId, action, performedBy, comments, metadata) {
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
        const workflowAction = {
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
        if (step.status === 'completed' && instance.currentStep < instance.steps.length - 1) {
            instance.currentStep++;
            const nextStep = instance.steps[instance.currentStep];
            nextStep.status = 'pending';
            this.emit('workflow.step.completed', instance, step);
        }
        else if (step.status === 'completed' && instance.currentStep === instance.steps.length - 1) {
            instance.status = 'completed';
            this.emit('workflow.completed', instance);
        }
        this.checkSLA(instance);
        return instance;
    }
    checkSLA(instance) {
        if (!instance.sla || !instance.dueDate)
            return;
        const now = new Date();
        const timeRemaining = instance.dueDate.getTime() - now.getTime();
        const hoursRemaining = timeRemaining / (1000 * 60 * 60);
        if (hoursRemaining < 0) {
            this.emit('sla.breached', instance);
        }
        else if (hoursRemaining < instance.sla.warningThreshold) {
            this.emit('sla.warning', instance, hoursRemaining);
        }
    }
    getInstanceActions(instanceId) {
        return this.actions.filter(action => action.instanceId === instanceId);
    }
    getOverdueWorkflows() {
        const now = new Date();
        return Array.from(this.instances.values()).filter(instance => {
            if (!instance.dueDate || instance.status === 'completed' || instance.status === 'cancelled') {
                return false;
            }
            return instance.dueDate < now;
        });
    }
    getWorkflowsRequiringAttention(role) {
        return Array.from(this.instances.values()).filter(instance => {
            if (instance.status !== 'active')
                return false;
            const currentStep = instance.steps[instance.currentStep];
            return currentStep.role === role && currentStep.status === 'pending';
        });
    }
    updateMetadata(instanceId, metadata) {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            throw new Error(`Workflow instance not found: ${instanceId}`);
        }
        instance.metadata = { ...instance.metadata, ...metadata };
        instance.updatedAt = new Date();
        return instance;
    }
    pauseInstance(instanceId) {
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
    resumeInstance(instanceId) {
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
    cancelInstance(instanceId, reason) {
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
exports.WorkflowEngine = WorkflowEngine;
exports.workflowEngine = new WorkflowEngine();
//# sourceMappingURL=workflow.engine.js.map