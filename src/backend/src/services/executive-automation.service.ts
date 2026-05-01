/**
 * Executive Team Automation Service
 * Cron-based triggers for executive approval workflows, SLA monitoring,
 * automated escalations, and governance reporting.
 */

import { EventEmitter } from 'events';
import logger from '../config/logger';

// ============================================
// Types
// ============================================

export interface ExecutiveTeamMember {
  id: string;
  name: string;
  email: string;
  role: ExecutiveRole;
  department: string;
  isActive: boolean;
  escalationOrder: number; // 1 = direct report, 2 = HOD, 3 = executive, 4 = board
}

export type ExecutiveRole =
  | 'risk_owner'
  | 'department_head'
  | 'executive_director'
  | 'chief_risk_officer'
  | 'ceo'
  | 'board_member'
  | 'audit_committee'
  | 'compliance_committee';

export interface EscalationRule {
  id: string;
  name: string;
  trigger: EscalationTrigger;
  conditions: EscalationCondition[];
  actions: EscalationAction[];
  isActive: boolean;
}

export type EscalationTrigger =
  | 'sla_breach'
  | 'approval_pending_24h'
  | 'approval_pending_48h'
  | 'approval_pending_7d'
  | 'risk_threshold_exceeded'
  | 'compliance_due'
  | 'control_failure'
  | 'step_rejected';

export interface EscalationCondition {
  field: string;
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
}

export interface EscalationAction {
  type: 'notify' | 'escalate_to' | 'pause_workflow' | 'create_task' | 'send_email' | 'generate_report';
  target: string; // role or email
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string; // cron expression
  handler: string; // function name
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

// ============================================
// Executive Automation Service
// ============================================

class ExecutiveAutomationService extends EventEmitter {
  private static instance: ExecutiveAutomationService;
  
  private cronJobs: Map<string, CronJob> = new Map();
  private escalationRules: Map<string, EscalationRule> = new Map();
  private teamMembers: Map<string, ExecutiveTeamMember> = new Map();
  private digests: ExecutiveDigest[] = [];
  private cronTimer: NodeJS.Timeout | null = null;
  
  // Default escalation chain
  private readonly defaultEscalationChain: ExecutiveRole[] = [
    'risk_owner',
    'department_head',
    'executive_director',
    'chief_risk_officer',
    'ceo',
    'board_member',
  ];

  private constructor() {
    super();
    this.initializeDefaultRules();
    this.initializeDefaultCronJobs();
  }

  static getInstance(): ExecutiveAutomationService {
    if (!ExecutiveAutomationService.instance) {
      ExecutiveAutomationService.instance = new ExecutiveAutomationService();
    }
    return ExecutiveAutomationService.instance;
  }

  // ============================================
  // Initialization
  // ============================================

  private initializeDefaultRules(): void {
    const defaultRules: EscalationRule[] = [
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

    logger.info(`Initialized ${defaultRules.length} default escalation rules`);
  }

  private initializeDefaultCronJobs(): void {
    const defaultJobs: CronJob[] = [
      {
        id: 'sla-check-hourly',
        name: 'Hourly SLA Breach Check',
        schedule: '0 * * * *', // Every hour at :00
        handler: 'checkSlaBreaches',
        lastRun: null,
        nextRun: null,
        isActive: true,
        description: 'Check all active workflow items for SLA breaches and trigger escalations',
      },
      {
        id: 'executive-digest-daily',
        name: 'Daily Executive Digest',
        schedule: '0 7 * * 1-5', // Weekdays at 7AM
        handler: 'generateExecutiveDigest',
        lastRun: null,
        nextRun: null,
        isActive: true,
        description: 'Generate and send daily executive summary report',
      },
      {
        id: 'approval-reminders',
        name: 'Approval Pending Reminders',
        schedule: '0 */6 * * *', // Every 6 hours
        handler: 'checkPendingApprovals',
        lastRun: null,
        nextRun: null,
        isActive: true,
        description: 'Check for pending approvals and send reminders/escalations',
      },
      {
        id: 'compliance-monitor',
        name: 'Compliance Deadline Monitor',
        schedule: '0 8 * * *', // Daily at 8AM
        handler: 'checkComplianceDeadlines',
        lastRun: null,
        nextRun: null,
        isActive: true,
        description: 'Monitor upcoming compliance deadlines and notify responsible parties',
      },
      {
        id: 'weekly-strategy-report',
        name: 'Weekly Executive Strategy Report',
        schedule: '0 9 * * 1', // Mondays at 9AM
        handler: 'generateWeeklyReport',
        lastRun: null,
        nextRun: null,
        isActive: true,
        description: 'Generate comprehensive weekly governance report for executive team',
      },
      {
        id: 'risk-dashboard-refresh',
        name: 'Risk Dashboard Refresh',
        schedule: '*/30 * * * *', // Every 30 minutes
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

    logger.info(`Initialized ${defaultJobs.length} default cron jobs`);
  }

  // ============================================
  // Team Management
  // ============================================

  registerTeamMember(member: ExecutiveTeamMember): void {
    this.teamMembers.set(member.id, member);
    logger.info(`Registered executive team member: ${member.name} (${member.role})`);
  }

  registerTeamMembers(members: ExecutiveTeamMember[]): void {
    members.forEach(m => this.registerTeamMember(m));
  }

  getTeamMember(id: string): ExecutiveTeamMember | undefined {
    return this.teamMembers.get(id);
  }

  getTeamByRole(role: ExecutiveRole): ExecutiveTeamMember[] {
    return Array.from(this.teamMembers.values()).filter(m => m.role === role && m.isActive);
  }

  getEscalationChain(startRole: ExecutiveRole): ExecutiveTeamMember[] {
    const startIndex = this.defaultEscalationChain.indexOf(startRole);
    if (startIndex === -1) return [];

    const chain: ExecutiveTeamMember[] = [];
    for (let i = startIndex; i < this.defaultEscalationChain.length; i++) {
      const members = this.getTeamByRole(this.defaultEscalationChain[i]);
      chain.push(...members);
    }
    return chain;
  }

  // ============================================
  // Cron Job Management
  // ============================================

  startCronScheduler(): void {
    if (this.cronTimer) {
      logger.warn('Cron scheduler already running');
      return;
    }

    logger.info('Starting executive automation cron scheduler...');
    
    const now = new Date();
    this.cronJobs.forEach(job => {
      job.nextRun = this.calculateNextRun(job.schedule, now);
      logger.info(`  Cron '${job.name}': next run at ${job.nextRun?.toISOString()}`);
    });

    // Check every minute for jobs that need to run
    this.cronTimer = setInterval(() => {
      this.checkCronJobs();
    }, 60000); // Check every 60 seconds

    logger.info('Executive automation cron scheduler started');
  }

  stopCronScheduler(): void {
    if (this.cronTimer) {
      clearInterval(this.cronTimer);
      this.cronTimer = null;
      logger.info('Executive automation cron scheduler stopped');
    }
  }

  private checkCronJobs(): void {
    const now = new Date();
    
    this.cronJobs.forEach((job, id) => {
      if (!job.isActive || !job.nextRun) return;
      
      if (now >= job.nextRun) {
        logger.info(`Triggering cron job: ${job.name} (${id})`);
        this.executeCronJob(job);
        
        // Update timestamps
        job.lastRun = now;
        job.nextRun = this.calculateNextRun(job.schedule, now);
      }
    });
  }

  private executeCronJob(job: CronJob): void {
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
        logger.warn(`Unknown cron handler: ${job.handler}`);
    }
    
    this.emit('cron.completed', job);
  }

  private calculateNextRun(cronExpression: string, from: Date): Date | null {
    // Simple cron parser for common patterns
    // Supports: minute hour dayOfMonth month dayOfWeek
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) return null;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    // Start from the next minute
    const next = new Date(from);
    next.setSeconds(0, 0);
    next.setMinutes(next.getMinutes() + 1);

    // Simple calculation for common patterns - iterate up to 60 minutes ahead
    let attempts = 0;
    while (attempts < 1440) { // Check up to 24 hours ahead
      if (this.matchesCron(parts, next)) {
        return next;
      }
      next.setMinutes(next.getMinutes() + 1);
      attempts++;
    }
    
    return null;
  }

  private matchesCron(parts: string[], date: Date): boolean {
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    // Check minute
    if (minute !== '*' && !this.cronValueMatches(minute, date.getMinutes())) return false;
    // Check hour
    if (hour !== '*' && !this.cronValueMatches(hour, date.getHours())) return false;
    // Check day of month
    if (dayOfMonth !== '*' && !this.cronValueMatches(dayOfMonth, date.getDate())) return false;
    // Check month
    if (month !== '*' && !this.cronValueMatches(month, date.getMonth() + 1)) return false;
    // Check day of week (0 = Sunday)
    if (dayOfWeek !== '*' && !this.cronValueMatches(dayOfWeek, date.getDay())) return false;

    return true;
  }

  private cronValueMatches(pattern: string, value: number): boolean {
    // Handle '*/N' syntax
    if (pattern.startsWith('*/')) {
      const interval = parseInt(pattern.slice(2));
      return value % interval === 0;
    }
    // Handle 'N' syntax
    if (!pattern.includes(',')) {
      return parseInt(pattern) === value;
    }
    // Handle 'N,M,O' syntax
    return pattern.split(',').some(p => parseInt(p.trim()) === value);
  }

  // ============================================
  // Business Logic Handlers
  // ============================================

  private runSlaBreachCheck(): void {
    logger.info('Running SLA breach check...');
    this.emit('sla.check.started');
    
    // This would query the database for active workflow instances
    // and apply escalation rules based on overdue status
    
    try {
      // In production, this queries:
      //   SELECT * FROM workflow_instances 
      //   WHERE status = 'active' AND due_date < NOW()
      //   AND current_step > 0
      
      // For each breach found, apply escalation rules
      logger.info('SLA breach check completed');
      this.emit('sla.check.completed');
    } catch (error) {
      logger.error('SLA breach check failed', { error });
      this.emit('sla.check.failed', error);
    }
  }

  private runExecutiveDigestGeneration(): void {
    logger.info('Generating daily executive digest...');
    
    const digest: ExecutiveDigest = {
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
      // In production, this would aggregate from the database:
      //   - Pending approvals count by priority
      //   - Critical risks requiring executive attention
      //   - SLA breaches in last 24 hours
      //   - Recent executive decisions (last 24h)
      //   - Upcoming compliance deadlines
      
      this.digests.push(digest);
      logger.info(`Executive digest generated: ${digest.id}`);
      this.emit('digest.generated', digest);
    } catch (error) {
      logger.error('Executive digest generation failed', { error });
    }
  }

  private runPendingApprovalCheck(): void {
    logger.info('Checking pending approvals...');
    this.emit('approvals.check.started');

    try {
      // In production, this queries:
      //   SELECT * FROM workflow_step_instances 
      //   WHERE status = 'pending' 
      //   AND (type = 'approval' OR type = 'decision')
      //   AND created_at < NOW() - INTERVAL '24 hours'
      
      // For each pending approval, check if it needs:
      //   - Reminder (24h - 48h)
      //   - Escalation (48h+)
      //   - Critical escalation (7d+)
      
      logger.info('Pending approval check completed');
      this.emit('approvals.check.completed');
    } catch (error) {
      logger.error('Pending approval check failed', { error });
      this.emit('approvals.check.failed', error);
    }
  }

  private runComplianceDeadlineCheck(): void {
    logger.info('Checking compliance deadlines...');
    this.emit('compliance.check.started');

    try {
      // In production, this queries:
      //   SELECT * FROM compliance_requirements 
      //   WHERE next_review_date IS NOT NULL
      //   AND next_review_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
      
      // For each approaching deadline, send notifications
      
      logger.info('Compliance deadline check completed');
      this.emit('compliance.check.completed');
    } catch (error) {
      logger.error('Compliance deadline check failed', { error });
      this.emit('compliance.check.failed', error);
    }
  }

  private runWeeklyReportGeneration(): void {
    logger.info('Generating weekly executive strategy report...');
    this.emit('weekly.report.started');

    try {
      // Comprehensive weekly report including:
      //   - Risk register changes (new, closed, modified)
      //   - Compliance status changes
      //   - Control testing results
      //   - Workflow throughput metrics
      //   - Escalation summary
      //   - Upcoming critical dates
      
      logger.info('Weekly strategy report generated');
      this.emit('weekly.report.completed');
    } catch (error) {
      logger.error('Weekly report generation failed', { error });
      this.emit('weekly.report.failed', error);
    }
  }

  private runRiskDashboardRefresh(): void {
    try {
      // Refresh in-memory/Redis cache for risk dashboard
      // This would aggregate and cache:
      //   - Risk heat map data (5x5 matrix)
      //   - Department risk profiles
      //   - Top 10 risks by score
      //   - Trends (risks added/closed this week)
      
      logger.debug('Risk dashboard refreshed');
    } catch (error) {
      logger.error('Risk dashboard refresh failed', { error });
    }
  }

  // ============================================
  // Escalation Methods
  // ============================================

  escalateWorkflowItem(
    itemId: string,
    itemType: 'workflow' | 'risk' | 'compliance' | 'control',
    currentAssigneeRole: ExecutiveRole,
    reason: string
  ): void {
    const chain = this.getEscalationChain(currentAssigneeRole);
    
    if (chain.length === 0) {
      logger.warn(`No escalation chain found for role: ${currentAssigneeRole}`);
      return;
    }

    // Escalate to the next person in chain
    const nextEscalation = chain[0];
    
    logger.info(`Escalating ${itemType} ${itemId} to ${nextEscalation.name} (${nextEscalation.role}) - Reason: ${reason}`);
    
    this.emit('workflow.escalated', {
      itemId,
      itemType,
      from: currentAssigneeRole,
      to: nextEscalation,
      reason,
      timestamp: new Date(),
    });
  }

  triggerCustomEscalation(ruleId: string, context: Record<string, any>): void {
    const rule = this.escalationRules.get(ruleId);
    if (!rule || !rule.isActive) {
      logger.warn(`Escalation rule not found or inactive: ${ruleId}`);
      return;
    }

    logger.info(`Triggering custom escalation: ${rule.name}`, { context });
    this.emit('escalation.triggered', { rule, context, timestamp: new Date() });
  }

  // ============================================
  // API Accessors
  // ============================================

  getCronJobs(): CronJob[] {
    return Array.from(this.cronJobs.values());
  }

  getEscalationRules(): EscalationRule[] {
    return Array.from(this.escalationRules.values());
  }

  getTeamMembers(): ExecutiveTeamMember[] {
    return Array.from(this.teamMembers.values());
  }

  getRecentDigests(limit: number = 10): ExecutiveDigest[] {
    return this.digests.slice(-limit);
  }

  addEscalationRule(rule: EscalationRule): void {
    this.escalationRules.set(rule.id, rule);
    logger.info(`Added escalation rule: ${rule.name}`);
  }

  updateCronJob(jobId: string, updates: Partial<CronJob>): void {
    const job = this.cronJobs.get(jobId);
    if (!job) {
      logger.warn(`Cron job not found: ${jobId}`);
      return;
    }
    Object.assign(job, updates);
    logger.info(`Updated cron job: ${job.name}`);
  }

  toggleCronJob(jobId: string, isActive: boolean): void {
    const job = this.cronJobs.get(jobId);
    if (!job) {
      logger.warn(`Cron job not found: ${jobId}`);
      return;
    }
    job.isActive = isActive;
    logger.info(`${isActive ? 'Activated' : 'Deactivated'} cron job: ${job.name}`);
  }
}

export default ExecutiveAutomationService;
