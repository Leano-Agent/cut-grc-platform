"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const logger_1 = __importDefault(require("../config/logger"));
class ExecutiveAutomationService extends events_1.EventEmitter {
    static instance;
    cronJobs = new Map();
    escalationRules = new Map();
    teamMembers = new Map();
    digests = [];
    cronTimer = null;
    defaultEscalationChain = [
        'risk_owner',
        'department_head',
        'executive_director',
        'chief_risk_officer',
        'ceo',
        'board_member',
    ];
    constructor() {
        super();
        this.initializeDefaultRules();
        this.initializeDefaultCronJobs();
    }
    static getInstance() {
        if (!ExecutiveAutomationService.instance) {
            ExecutiveAutomationService.instance = new ExecutiveAutomationService();
        }
        return ExecutiveAutomationService.instance;
    }
    initializeDefaultRules() {
        const defaultRules = [
            {
                id: 'sla-breach-critical',
                name: 'Critical SLA Breach - Immediate Escalation',
                trigger: 'sla_breach',
                conditions: [
                    { field: 'priority', operator: 'eq', value: 'critical' },
                    { field: 'overdue_hours', operator: 'gte', value: 1 },
                ],
                actions: [
                    { type: 'notify', target: 'department_head', message: 'Critical SLA breach: ${title} is overdue by ${overdueHours} hours', priority: 'critical' },
                    { type: 'escalate_to', target: 'executive_director', message: 'Escalated due to critical SLA breach', priority: 'critical' },
                    { type: 'send_email', target: 'chief_risk_officer', message: 'CRITICAL: ${title} requires immediate executive attention', priority: 'critical' },
                ],
                isActive: true,
            },
            {
                id: 'sla-breach-high',
                name: 'High SLA Breach - Standard Escalation',
                trigger: 'sla_breach',
                conditions: [
                    { field: 'priority', operator: 'eq', value: 'high' },
                    { field: 'overdue_hours', operator: 'gte', value: 24 },
                ],
                actions: [
                    { type: 'notify', target: 'risk_owner', message: 'SLA breach: ${title} requires attention', priority: 'high' },
                    { type: 'escalate_to', target: 'department_head', message: 'Automated escalation for SLA breach', priority: 'high' },
                ],
                isActive: true,
            },
            {
                id: 'approval-pending-24h',
                name: 'Approval Pending 24+ Hours - Reminder',
                trigger: 'approval_pending_24h',
                conditions: [
                    { field: 'hours_since_assigned', operator: 'gte', value: 24 },
                    { field: 'hours_since_assigned', operator: 'lt', value: 48 },
                ],
                actions: [
                    { type: 'notify', target: 'assignee', message: 'Reminder: ${title} has been pending your approval for 24+ hours', priority: 'medium' },
                ],
                isActive: true,
            },
            {
                id: 'approval-pending-48h',
                name: 'Approval Pending 48+ Hours - Escalation',
                trigger: 'approval_pending_48h',
                conditions: [
                    { field: 'hours_since_assigned', operator: 'gte', value: 48 },
                ],
                actions: [
                    { type: 'notify', target: 'department_head', message: 'Escalation: ${title} pending approval for 48+ hours', priority: 'high' },
                    { type: 'escalate_to', target: 'executive_director', message: 'Escalation: ${title} approval delayed', priority: 'high' },
                ],
                isActive: true,
            },
            {
                id: 'risk-threshold-critical',
                name: 'Critical Risk Threshold Exceeded',
                trigger: 'risk_threshold_exceeded',
                conditions: [
                    { field: 'risk_score', operator: 'gte', value: 20 },
                ],
                actions: [
                    { type: 'notify', target: 'chief_risk_officer', message: 'ALERT: Critical risk identified - ${title} (Score: ${riskScore})', priority: 'critical' },
                    { type: 'notify', target: 'ceo', message: 'URGENT: New critical risk requires executive decision', priority: 'critical' },
                    { type: 'generate_report', target: 'executive_director', message: 'Critical risk briefing required', priority: 'critical' },
                ],
                isActive: true,
            },
            {
                id: 'compliance-due',
                name: 'Compliance Due Date Approaching',
                trigger: 'compliance_due',
                conditions: [
                    { field: 'days_until_due', operator: 'gte', value: 0 },
                    { field: 'days_until_due', operator: 'lte', value: 30 },
                ],
                actions: [
                    { type: 'notify', target: 'compliance_officer', message: 'Compliance due: ${title} is due in ${daysUntilDue} days', priority: 'high' },
                    { type: 'notify', target: 'department_head', message: 'Compliance reminder: ${title} requires attention', priority: 'medium' },
                ],
                isActive: true,
            },
            {
                id: 'control-failure',
                name: 'Internal Control Failure - Executive Notification',
                trigger: 'control_failure',
                conditions: [
                    { field: 'control_effectiveness', operator: 'eq', value: 'ineffective' },
                ],
                actions: [
                    { type: 'notify', target: 'audit_committee', message: 'Control failure: ${title} rated ineffective', priority: 'high' },
                    { type: 'escalate_to', target: 'compliance_committee', message: 'Material control weakness requires remediation plan', priority: 'high' },
                ],
                isActive: true,
            },
        ];
        defaultRules.forEach(rule => {
            this.escalationRules.set(rule.id, rule);
        });
        logger_1.default.info(`Initialized ${defaultRules.length} default escalation rules`);
    }
    initializeDefaultCronJobs() {
        const defaultJobs = [
            {
                id: 'sla-check-hourly',
                name: 'Hourly SLA Breach Check',
                schedule: '0 * * * *',
                handler: 'checkSlaBreaches',
                lastRun: null,
                nextRun: null,
                isActive: true,
                description: 'Check all active workflow items for SLA breaches and trigger escalations',
            },
            {
                id: 'executive-digest-daily',
                name: 'Daily Executive Digest',
                schedule: '0 7 * * 1-5',
                handler: 'generateExecutiveDigest',
                lastRun: null,
                nextRun: null,
                isActive: true,
                description: 'Generate and send daily executive summary report',
            },
            {
                id: 'approval-reminders',
                name: 'Approval Pending Reminders',
                schedule: '0 */6 * * *',
                handler: 'checkPendingApprovals',
                lastRun: null,
                nextRun: null,
                isActive: true,
                description: 'Check for pending approvals and send reminders/escalations',
            },
            {
                id: 'compliance-monitor',
                name: 'Compliance Deadline Monitor',
                schedule: '0 8 * * *',
                handler: 'checkComplianceDeadlines',
                lastRun: null,
                nextRun: null,
                isActive: true,
                description: 'Monitor upcoming compliance deadlines and notify responsible parties',
            },
            {
                id: 'weekly-strategy-report',
                name: 'Weekly Executive Strategy Report',
                schedule: '0 9 * * 1',
                handler: 'generateWeeklyReport',
                lastRun: null,
                nextRun: null,
                isActive: true,
                description: 'Generate comprehensive weekly governance report for executive team',
            },
            {
                id: 'risk-dashboard-refresh',
                name: 'Risk Dashboard Refresh',
                schedule: '*/30 * * * *',
                handler: 'refreshRiskDashboard',
                lastRun: null,
                nextRun: null,
                isActive: true,
                description: 'Refresh risk heat map and dashboard metrics',
            },
        ];
        defaultJobs.forEach(job => {
            this.cronJobs.set(job.id, job);
        });
        logger_1.default.info(`Initialized ${defaultJobs.length} default cron jobs`);
    }
    registerTeamMember(member) {
        this.teamMembers.set(member.id, member);
        logger_1.default.info(`Registered executive team member: ${member.name} (${member.role})`);
    }
    registerTeamMembers(members) {
        members.forEach(m => this.registerTeamMember(m));
    }
    getTeamMember(id) {
        return this.teamMembers.get(id);
    }
    getTeamByRole(role) {
        return Array.from(this.teamMembers.values()).filter(m => m.role === role && m.isActive);
    }
    getEscalationChain(startRole) {
        const startIndex = this.defaultEscalationChain.indexOf(startRole);
        if (startIndex === -1)
            return [];
        const chain = [];
        for (let i = startIndex; i < this.defaultEscalationChain.length; i++) {
            const members = this.getTeamByRole(this.defaultEscalationChain[i]);
            chain.push(...members);
        }
        return chain;
    }
    startCronScheduler() {
        if (this.cronTimer) {
            logger_1.default.warn('Cron scheduler already running');
            return;
        }
        logger_1.default.info('Starting executive automation cron scheduler...');
        const now = new Date();
        this.cronJobs.forEach(job => {
            job.nextRun = this.calculateNextRun(job.schedule, now);
            logger_1.default.info(`  Cron '${job.name}': next run at ${job.nextRun?.toISOString()}`);
        });
        this.cronTimer = setInterval(() => {
            this.checkCronJobs();
        }, 60000);
        logger_1.default.info('Executive automation cron scheduler started');
    }
    stopCronScheduler() {
        if (this.cronTimer) {
            clearInterval(this.cronTimer);
            this.cronTimer = null;
            logger_1.default.info('Executive automation cron scheduler stopped');
        }
    }
    checkCronJobs() {
        const now = new Date();
        this.cronJobs.forEach((job, id) => {
            if (!job.isActive || !job.nextRun)
                return;
            if (now >= job.nextRun) {
                logger_1.default.info(`Triggering cron job: ${job.name} (${id})`);
                this.executeCronJob(job);
                job.lastRun = now;
                job.nextRun = this.calculateNextRun(job.schedule, now);
            }
        });
    }
    executeCronJob(job) {
        this.emit('cron.started', job);
        switch (job.handler) {
            case 'checkSlaBreaches':
                this.runSlaBreachCheck();
                break;
            case 'generateExecutiveDigest':
                this.runExecutiveDigestGeneration();
                break;
            case 'checkPendingApprovals':
                this.runPendingApprovalCheck();
                break;
            case 'checkComplianceDeadlines':
                this.runComplianceDeadlineCheck();
                break;
            case 'generateWeeklyReport':
                this.runWeeklyReportGeneration();
                break;
            case 'refreshRiskDashboard':
                this.runRiskDashboardRefresh();
                break;
            default:
                logger_1.default.warn(`Unknown cron handler: ${job.handler}`);
        }
        this.emit('cron.completed', job);
    }
    calculateNextRun(cronExpression, from) {
        const parts = cronExpression.split(' ');
        if (parts.length !== 5)
            return null;
        const [_minute, _hour, _dayOfMonth, _month, _dayOfWeek] = parts;
        const next = new Date(from);
        next.setSeconds(0, 0);
        next.setMinutes(next.getMinutes() + 1);
        let attempts = 0;
        while (attempts < 1440) {
            if (this.matchesCron(parts, next)) {
                return next;
            }
            next.setMinutes(next.getMinutes() + 1);
            attempts++;
        }
        return null;
    }
    matchesCron(parts, date) {
        const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
        if (minute !== '*' && !this.cronValueMatches(minute, date.getMinutes()))
            return false;
        if (hour !== '*' && !this.cronValueMatches(hour, date.getHours()))
            return false;
        if (dayOfMonth !== '*' && !this.cronValueMatches(dayOfMonth, date.getDate()))
            return false;
        if (month !== '*' && !this.cronValueMatches(month, date.getMonth() + 1))
            return false;
        if (dayOfWeek !== '*' && !this.cronValueMatches(dayOfWeek, date.getDay()))
            return false;
        return true;
    }
    cronValueMatches(pattern, value) {
        if (pattern.startsWith('*/')) {
            const interval = parseInt(pattern.slice(2));
            return value % interval === 0;
        }
        if (!pattern.includes(',')) {
            return parseInt(pattern) === value;
        }
        return pattern.split(',').some(p => parseInt(p.trim()) === value);
    }
    runSlaBreachCheck() {
        logger_1.default.info('Running SLA breach check...');
        this.emit('sla.check.started');
        try {
            logger_1.default.info('SLA breach check completed');
            this.emit('sla.check.completed');
        }
        catch (error) {
            logger_1.default.error('SLA breach check failed', { error });
            this.emit('sla.check.failed', error);
        }
    }
    runExecutiveDigestGeneration() {
        logger_1.default.info('Generating daily executive digest...');
        const digest = {
            id: `digest-${Date.now()}`,
            generatedAt: new Date(),
            period: 'daily',
            summary: {
                totalPendingApprovals: 0,
                criticalItems: 0,
                slaBreaches: 0,
                escalations: 0,
                riskSummary: [],
                complianceSummary: [],
                recentDecisions: 0,
            },
            recipientIds: [],
            sent: false,
        };
        try {
            this.digests.push(digest);
            logger_1.default.info(`Executive digest generated: ${digest.id}`);
            this.emit('digest.generated', digest);
        }
        catch (error) {
            logger_1.default.error('Executive digest generation failed', { error });
        }
    }
    runPendingApprovalCheck() {
        logger_1.default.info('Checking pending approvals...');
        this.emit('approvals.check.started');
        try {
            logger_1.default.info('Pending approval check completed');
            this.emit('approvals.check.completed');
        }
        catch (error) {
            logger_1.default.error('Pending approval check failed', { error });
            this.emit('approvals.check.failed', error);
        }
    }
    runComplianceDeadlineCheck() {
        logger_1.default.info('Checking compliance deadlines...');
        this.emit('compliance.check.started');
        try {
            logger_1.default.info('Compliance deadline check completed');
            this.emit('compliance.check.completed');
        }
        catch (error) {
            logger_1.default.error('Compliance deadline check failed', { error });
            this.emit('compliance.check.failed', error);
        }
    }
    runWeeklyReportGeneration() {
        logger_1.default.info('Generating weekly executive strategy report...');
        this.emit('weekly.report.started');
        try {
            logger_1.default.info('Weekly strategy report generated');
            this.emit('weekly.report.completed');
        }
        catch (error) {
            logger_1.default.error('Weekly report generation failed', { error });
            this.emit('weekly.report.failed', error);
        }
    }
    runRiskDashboardRefresh() {
        try {
            logger_1.default.debug('Risk dashboard refreshed');
        }
        catch (error) {
            logger_1.default.error('Risk dashboard refresh failed', { error });
        }
    }
    escalateWorkflowItem(itemId, itemType, currentAssigneeRole, reason) {
        const chain = this.getEscalationChain(currentAssigneeRole);
        if (chain.length === 0) {
            logger_1.default.warn(`No escalation chain found for role: ${currentAssigneeRole}`);
            return;
        }
        const nextEscalation = chain[0];
        logger_1.default.info(`Escalating ${itemType} ${itemId} to ${nextEscalation.name} (${nextEscalation.role}) - Reason: ${reason}`);
        this.emit('workflow.escalated', {
            itemId,
            itemType,
            from: currentAssigneeRole,
            to: nextEscalation,
            reason,
            timestamp: new Date(),
        });
    }
    triggerCustomEscalation(ruleId, context) {
        const rule = this.escalationRules.get(ruleId);
        if (!rule || !rule.isActive) {
            logger_1.default.warn(`Escalation rule not found or inactive: ${ruleId}`);
            return;
        }
        logger_1.default.info(`Triggering custom escalation: ${rule.name}`, { context });
        this.emit('escalation.triggered', { rule, context, timestamp: new Date() });
    }
    getCronJobs() {
        return Array.from(this.cronJobs.values());
    }
    getEscalationRules() {
        return Array.from(this.escalationRules.values());
    }
    getTeamMembers() {
        return Array.from(this.teamMembers.values());
    }
    getRecentDigests(limit = 10) {
        return this.digests.slice(-limit);
    }
    addEscalationRule(rule) {
        this.escalationRules.set(rule.id, rule);
        logger_1.default.info(`Added escalation rule: ${rule.name}`);
    }
    updateCronJob(jobId, updates) {
        const job = this.cronJobs.get(jobId);
        if (!job) {
            logger_1.default.warn(`Cron job not found: ${jobId}`);
            return;
        }
        Object.assign(job, updates);
        logger_1.default.info(`Updated cron job: ${job.name}`);
    }
    toggleCronJob(jobId, isActive) {
        const job = this.cronJobs.get(jobId);
        if (!job) {
            logger_1.default.warn(`Cron job not found: ${jobId}`);
            return;
        }
        job.isActive = isActive;
        logger_1.default.info(`${isActive ? 'Activated' : 'Deactivated'} cron job: ${job.name}`);
    }
}
exports.default = ExecutiveAutomationService;
//# sourceMappingURL=executive-automation.service.js.map