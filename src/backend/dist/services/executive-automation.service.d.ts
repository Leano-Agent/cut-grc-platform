import { EventEmitter } from 'events';
export interface ExecutiveTeamMember {
    id: string;
    name: string;
    email: string;
    role: ExecutiveRole;
    department: string;
    isActive: boolean;
    escalationOrder: number;
}
export type ExecutiveRole = 'risk_owner' | 'department_head' | 'executive_director' | 'chief_risk_officer' | 'ceo' | 'board_member' | 'audit_committee' | 'compliance_committee';
export interface EscalationRule {
    id: string;
    name: string;
    trigger: EscalationTrigger;
    conditions: EscalationCondition[];
    actions: EscalationAction[];
    isActive: boolean;
}
export type EscalationTrigger = 'sla_breach' | 'approval_pending_24h' | 'approval_pending_48h' | 'approval_pending_7d' | 'risk_threshold_exceeded' | 'compliance_due' | 'control_failure' | 'step_rejected';
export interface EscalationCondition {
    field: string;
    operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
    value: any;
}
export interface EscalationAction {
    type: 'notify' | 'escalate_to' | 'pause_workflow' | 'create_task' | 'send_email' | 'generate_report';
    target: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
}
export interface CronJob {
    id: string;
    name: string;
    schedule: string;
    handler: string;
    lastRun: Date | null;
    nextRun: Date | null;
    isActive: boolean;
    description: string;
}
export interface ExecutiveDigest {
    id: string;
    generatedAt: Date;
    period: 'daily' | 'weekly' | 'monthly';
    summary: {
        totalPendingApprovals: number;
        criticalItems: number;
        slaBreaches: number;
        escalations: number;
        riskSummary: RiskSummaryItem[];
        complianceSummary: ComplianceSummaryItem[];
        recentDecisions: number;
    };
    recipientIds: string[];
    sent: boolean;
    sentAt?: Date;
}
export interface RiskSummaryItem {
    riskId: string;
    title: string;
    severity: string;
    status: string;
    owner: string;
    daysSinceUpdate: number;
    needsAttention: boolean;
}
export interface ComplianceSummaryItem {
    requirementId: string;
    title: string;
    regulation: string;
    status: string;
    dueDate: string;
    daysUntilDue: number;
    overdue: boolean;
}
declare class ExecutiveAutomationService extends EventEmitter {
    private static instance;
    private cronJobs;
    private escalationRules;
    private teamMembers;
    private digests;
    private cronTimer;
    private readonly defaultEscalationChain;
    private constructor();
    static getInstance(): ExecutiveAutomationService;
    private initializeDefaultRules;
    private initializeDefaultCronJobs;
    registerTeamMember(member: ExecutiveTeamMember): void;
    registerTeamMembers(members: ExecutiveTeamMember[]): void;
    getTeamMember(id: string): ExecutiveTeamMember | undefined;
    getTeamByRole(role: ExecutiveRole): ExecutiveTeamMember[];
    getEscalationChain(startRole: ExecutiveRole): ExecutiveTeamMember[];
    startCronScheduler(): void;
    stopCronScheduler(): void;
    private checkCronJobs;
    private executeCronJob;
    private calculateNextRun;
    private matchesCron;
    private cronValueMatches;
    private runSlaBreachCheck;
    private runExecutiveDigestGeneration;
    private runPendingApprovalCheck;
    private runComplianceDeadlineCheck;
    private runWeeklyReportGeneration;
    private runRiskDashboardRefresh;
    escalateWorkflowItem(itemId: string, itemType: 'workflow' | 'risk' | 'compliance' | 'control', currentAssigneeRole: ExecutiveRole, reason: string): void;
    triggerCustomEscalation(ruleId: string, context: Record<string, any>): void;
    getCronJobs(): CronJob[];
    getEscalationRules(): EscalationRule[];
    getTeamMembers(): ExecutiveTeamMember[];
    getRecentDigests(limit?: number): ExecutiveDigest[];
    addEscalationRule(rule: EscalationRule): void;
    updateCronJob(jobId: string, updates: Partial<CronJob>): void;
    toggleCronJob(jobId: string, isActive: boolean): void;
}
export default ExecutiveAutomationService;
//# sourceMappingURL=executive-automation.service.d.ts.map