import { EventEmitter } from 'events';
export interface WorkflowStep {
    id: string;
    name: string;
    type: 'action' | 'approval' | 'notification' | 'decision';
    role: string;
    assignee?: string;
    dueDate?: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'escalated';
    actions: string[];
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
        warningThreshold: number;
        breachThreshold: number;
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
        duration: number;
        warningThreshold: number;
        breachThreshold: number;
    };
    roles: string[];
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
export declare class WorkflowEngine extends EventEmitter {
    private workflows;
    private instances;
    private actions;
    constructor();
    private setupEventHandlers;
    registerTemplate(template: WorkflowTemplate): void;
    createInstance(workflowId: string, title: string, createdBy: string, metadata?: Record<string, any>): WorkflowInstance;
    getInstance(instanceId: string): WorkflowInstance | undefined;
    getUserInstances(userId: string, role: string): WorkflowInstance[];
    performAction(instanceId: string, stepId: string, action: string, performedBy: string, comments?: string, metadata?: Record<string, any>): WorkflowInstance;
    private checkSLA;
    getInstanceActions(instanceId: string): WorkflowAction[];
    getOverdueWorkflows(): WorkflowInstance[];
    getWorkflowsRequiringAttention(role: string): WorkflowInstance[];
    updateMetadata(instanceId: string, metadata: Record<string, any>): WorkflowInstance;
    pauseInstance(instanceId: string): WorkflowInstance;
    resumeInstance(instanceId: string): WorkflowInstance;
    cancelInstance(instanceId: string, reason?: string): WorkflowInstance;
}
export declare const workflowEngine: WorkflowEngine;
//# sourceMappingURL=workflow.engine.d.ts.map