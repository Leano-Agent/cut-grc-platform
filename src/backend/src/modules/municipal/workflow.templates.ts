/**
 * Municipal Workflow Templates
 * Core workflow definitions for municipal operations
 */

import { WorkflowTemplate } from '../workflows/workflow.engine';

export const MUNICIPAL_WORKFLOW_TEMPLATES: Record<string, WorkflowTemplate> = {
  // 1. COUNCIL MEETING MANAGEMENT
  'council-meeting-management': {
    id: 'council-meeting-management',
    name: 'Council Meeting Management',
    description: 'End-to-end workflow for council meeting scheduling, agenda preparation, minutes recording, and resolution tracking',
    category: 'governance',
    version: 1,
    defaultPriority: 'high',
    defaultSla: {
      duration: 336, // 14 days (2 weeks)
      warningThreshold: 24, // 24 hours warning
      breachThreshold: 48, // 48 hours breach
    },
    roles: ['council_secretary', 'mayor', 'councilor', 'municipal_manager'],
    steps: [
      {
        name: 'Meeting Scheduling',
        type: 'action',
        role: 'council_secretary',
        dueDate: undefined,
        status: 'pending',
        actions: ['schedule', 'reschedule', 'cancel'],
        metadata: { requiresQuorum: true }
      },
      {
        name: 'Agenda Preparation',
        type: 'action',
        role: 'council_secretary',
        dueDate: undefined,
        status: 'pending',
        actions: ['draft', 'review', 'finalize'],
        metadata: { requiresApproval: true }
      },
      {
        name: 'Agenda Approval',
        type: 'approval',
        role: 'mayor',
        dueDate: undefined,
        status: 'pending',
        actions: ['approve', 'reject', 'request_changes'],
        metadata: { approvalRequired: true }
      },
      {
        name: 'Document Distribution',
        type: 'notification',
        role: 'council_secretary',
        dueDate: undefined,
        status: 'pending',
        actions: ['distribute', 'confirm_receipt'],
        metadata: { distributionList: 'all_councilors' }
      },
      {
        name: 'Meeting Conduct',
        type: 'action',
        role: 'mayor',
        dueDate: undefined,
        status: 'pending',
        actions: ['start', 'adjourn', 'recess'],
        metadata: { requiresMinutes: true }
      },
      {
        name: 'Minutes Recording',
        type: 'action',
        role: 'council_secretary',
        dueDate: undefined,
        status: 'pending',
        actions: ['record', 'transcribe', 'verify'],
        metadata: { accuracyCheck: true }
      },
      {
        name: 'Minutes Approval',
        type: 'approval',
        role: 'councilor',
        dueDate: undefined,
        status: 'pending',
        actions: ['approve', 'amend', 'reject'],
        metadata: { votingRequired: true }
      },
      {
        name: 'Resolution Tracking',
        type: 'action',
        role: 'municipal_manager',
        dueDate: undefined,
        status: 'pending',
        actions: ['assign', 'track', 'complete'],
        metadata: { followUpRequired: true }
      }
    ]
  },

  // 2. COMMITTEE WORKFLOW AUTOMATION
  'committee-workflow': {
    id: 'committee-workflow',
    name: 'Committee Workflow Automation',
    description: 'Committee meeting management, document review, recommendation processes, and inter-committee coordination',
    category: 'governance',
    version: 1,
    defaultPriority: 'medium',
    defaultSla: {
      duration: 168, // 7 days
      warningThreshold: 12,
      breachThreshold: 24,
    },
    roles: ['committee_chair', 'committee_secretary', 'committee_member', 'department_head'],
    steps: [
      {
        name: 'Meeting Scheduling',
        type: 'action',
        role: 'committee_secretary',
        dueDate: undefined,
        status: 'pending',
        actions: ['schedule', 'invite', 'confirm'],
        metadata: { requiresVenue: true }
      },
      {
        name: 'Document Submission',
        type: 'action',
        role: 'department_head',
        dueDate: undefined,
        status: 'pending',
        actions: ['submit', 'revise', 'withdraw'],
        metadata: { deadlineEnforced: true }
      },
      {
        name: 'Document Review',
        type: 'action',
        role: 'committee_member',
        dueDate: undefined,
        status: 'pending',
        actions: ['review', 'comment', 'recommend'],
        metadata: { reviewPeriod: 48 }
      },
      {
        name: 'Committee Deliberation',
        type: 'decision',
        role: 'committee_chair',
        dueDate: undefined,
        status: 'pending',
        actions: ['discuss', 'vote', 'defer'],
        metadata: { requiresQuorum: true }
      },
      {
        name: 'Recommendation Formulation',
        type: 'action',
        role: 'committee_secretary',
        dueDate: undefined,
        status: 'pending',
        actions: ['draft', 'review', 'finalize'],
        metadata: { templateBased: true }
      },
      {
        name: 'Recommendation Approval',
        type: 'approval',
        role: 'committee_chair',
        dueDate: undefined,
        status: 'pending',
        actions: ['approve', 'amend', 'reject'],
        metadata: { requiresSignOff: true }
      },
      {
        name: 'Inter-Committee Coordination',
        type: 'notification',
        role: 'committee_secretary',
        dueDate: undefined,
        status: 'pending',
        actions: ['coordinate', 'sync', 'report'],
        metadata: { crossCommittee: true }
      },
      {
        name: 'Implementation Tracking',
        type: 'action',
        role: 'department_head',
        dueDate: undefined,
        status: 'pending',
        actions: ['implement', 'report', 'close'],
        metadata: { monitoringRequired: true }
      }
    ]
  },

  // 3. SERVICE REQUEST MANAGEMENT
  'service-request-management': {
    id: 'service-request-management',
    name: 'Service Request Management',
    description: 'Citizen service request intake, departmental assignment, SLA tracking, and feedback collection',
    category: 'service_delivery',
    version: 1,
    defaultPriority: 'medium',
    defaultSla: {
      duration: 72, // 3 days
      warningThreshold: 6,
      breachThreshold: 12,
    },
    roles: ['customer_service', 'department_manager', 'service_agent', 'quality_assurance'],
    steps: [
      {
        name: 'Request Intake',
        type: 'action',
        role: 'customer_service',
        dueDate: undefined,
        status: 'pending',
        actions: ['register', 'categorize', 'prioritize'],
        metadata: { citizenFacing: true }
      },
      {
        name: 'Departmental Assignment',
        type: 'action',
        role: 'customer_service',
        dueDate: undefined,
        status: 'pending',
        actions: ['assign', 'reassign', 'escalate'],
        metadata: { autoRouting: true }
      },
      {
        name: 'Service Acknowledgement',
        type: 'notification',
        role: 'department_manager',
        dueDate: undefined,
        status: 'pending',
        actions: ['acknowledge', 'estimate', 'update'],
        metadata: { slaStart: true }
      },
      {
        name: 'Service Execution',
        type: 'action',
        role: 'service_agent',
        dueDate: undefined,
        status: 'pending',
        actions: ['execute', 'update', 'complete'],
        metadata: { qualityCheck: true }
      },
      {
        name: 'SLA Monitoring',
        type: 'action',
        role: 'department_manager',
        dueDate: undefined,
        status: 'pending',
        actions: ['monitor', 'escalate', 'extend'],
        metadata: { realTimeTracking: true }
      },
      {
        name: 'Quality Assurance',
        type: 'approval',
        role: 'quality_assurance',
        dueDate: undefined,
        status: 'pending',
        actions: ['verify', 'approve', 'reject'],
        metadata: { standardsCheck: true }
      },
      {
        name: 'Citizen Notification',
        type: 'notification',
        role: 'customer_service',
        dueDate: undefined,
        status: 'pending',
        actions: ['notify', 'follow_up', 'close'],
        metadata: { feedbackRequest: true }
      },
      {
        name: 'Feedback Collection',
        type: 'action',
        role: 'customer_service',
        dueDate: undefined,
        status: 'pending',
        actions: ['collect', 'analyze', 'report'],
        metadata: { satisfactionSurvey: true }
      }
    ]
  },

  // 4. DOCUMENT WORKFLOWS
  'document-workflow': {
    id: 'document-workflow',
    name: 'Document Approval and Routing',
    description: 'Document approval routing, version control, publishing workflows, and archival processes',
    category: 'administration',
    version: 1,
    defaultPriority: 'medium',
    defaultSla: {
      duration: 120, // 5 days
      warningThreshold: 12,
      breachThreshold: 24,
    },
    roles: ['document_owner', 'reviewer', 'approver', 'archivist'],
    steps: [
      {
        name: 'Document Creation',
        type: 'action',
        role: 'document_owner',
        dueDate: undefined,
        status: 'pending',
        actions: ['create', 'draft', 'save'],
        metadata: { versionControl: true }
      },
      {
        name: 'Initial Review',
        type: 'action',
        role: 'reviewer',
        dueDate: undefined,
        status: 'pending',
        actions: ['review', 'comment', 'suggest'],
        metadata: { technicalReview: true }
      },
      {
        name: 'Approval Routing',
        type: 'approval',
        role: 'approver',
        dueDate: undefined,
        status: 'pending',
        actions: ['approve', 'reject', 'delegate'],
        metadata: { sequentialApproval: true }
      },
      {
        name: 'Version Control',
        type: 'action',
        role: 'document_owner',
        dueDate: undefined,
        status: 'pending',
        actions: ['version', 'track', 'compare'],
        metadata: { changeTracking: true }
      },
      {
        name: 'Final Approval',
        type: 'approval',
        role: 'approver',
        dueDate: undefined,
        status: 'pending',
        actions: ['finalize', 'sign', 'authorize'],
        metadata: { requiresSignature: true }
      },
      {
        name: 'Document Publishing',
        type: 'action',
        role: 'document_owner',
        dueDate: undefined,
        status: 'pending',
        actions: ['publish', 'distribute', 'notify'],
        metadata: { accessControl: true }
      },
      {
        name: 'Archival Preparation',
        type: 'action',
        role: 'archivist',
        dueDate: undefined,
        status: 'pending',
        actions: ['categorize', 'index', 'prepare'],
        metadata: { retentionPolicy: true }
      },
      {
        name: 'Secure Archival',
        type: 'action',
        role: 'archivist',
        dueDate: undefined,
        status: 'pending',
        actions: ['archive', 'encrypt', 'backup'],
        metadata: { disposalSchedule: true }
      }
    ]
  },

  // 5. COMPLIANCE WORKFLOWS
  'compliance-workflow': {
    id: 'compliance-workflow',
    name: 'POPIA Compliance Management',
    description: 'POPIA compliance workflows, records retention scheduling, audit trail generation, and legal hold processes',
    category: 'compliance',
    version: 1,
    defaultPriority: 'high',
    defaultSla: {
      duration: 720, // 30 days
      warningThreshold: 48,
      breachThreshold: 96,
    },
    roles: ['compliance_officer', 'data_protection_officer', 'records_manager', 'legal_officer'],
    steps: [
      {
        name: 'Data Inventory',
        type: 'action',
        role: 'compliance_officer',
        dueDate: undefined,
        status: 'pending',
        actions: ['identify', 'categorize', 'document'],
        metadata: { popiaCategory: true }
      },
      {
        name: 'Risk Assessment',
        type: 'action',
        role: 'compliance_officer',
        dueDate: undefined,
        status: 'pending',
        actions: ['assess', 'score', 'prioritize'],
        metadata: { riskMatrix: true }
      },
      {
        name: 'Controls Implementation',
        type: 'action',
        role: 'compliance_officer',
        dueDate: undefined,
        status: 'pending',
        actions: ['implement', 'test', 'validate'],
        metadata: { securityControls: true }
      },
      {
        name: 'DPO Review',
        type: 'approval',
        role: 'data_protection_officer',
        dueDate: undefined,
        status: 'pending',
        actions: ['review', 'approve', 'recommend'],
        metadata: { legalCompliance: true }
      },
      {
        name: 'Records Retention',
        type: 'action',
        role: 'records_manager',
        dueDate: undefined,
        status: 'pending',
        actions: ['schedule', 'monitor', 'enforce'],
        metadata: { retentionPolicy: true }
      },
      {
        name: 'Audit Trail Generation',
        type: 'action',
        role: 'compliance_officer',
        dueDate: undefined,
        status: 'pending',
        actions: ['generate', 'verify', 'store'],
        metadata: { immutableLogs: true }
      },
      {
        name: 'Legal Hold Management',
        type: 'action',
        role: 'legal_officer',
        dueDate: undefined,
        status: 'pending',
        actions: ['initiate', 'maintain', 'release'],
        metadata: { litigationHold: true }
      },
      {
        name: 'Compliance Reporting',
        type: 'action',
        role: 'compliance_officer',
        dueDate: undefined,
        status: 'pending',
        actions: ['report', 'submit', 'archive'],
        metadata: { regulatoryReporting: true }
      }
    ]
  }
};

/**
 * Municipal role definitions
 */
export const MUNICIPAL_ROLES = {
  // Governance Roles
  'mayor': 'Municipal Mayor',
  'councilor': 'Municipal Councilor',
  'council_secretary': 'Council Secretary',
  'municipal_manager': 'Municipal Manager',
  'committee_chair': 'Committee Chairperson',
  'committee_secretary': 'Committee Secretary',
  'committee_member': 'Committee Member',
  
  // Service Delivery Roles
  'customer_service': 'Customer Service Officer',
  'department_manager': 'Department Manager',
  'service_agent': 'Service Delivery Agent',
  'quality_assurance': 'Quality Assurance Officer',
  
  // Administrative Roles
  'document_owner': 'Document Owner',
  'reviewer': 'Document Reviewer',
  'approver': 'Document Approver',
  'archivist': 'Records Archivist',
  'department_head': 'Department Head',
  
  // Compliance Roles
  'compliance_officer': 'Compliance Officer',
  'data_protection_officer': 'Data Protection Officer (POPIA)',
  'records_manager': 'Records Management Officer',
  'legal_officer': 'Legal Officer'
};

/**
 * Workflow categories with descriptions
 */
export const WORKFLOW_CATEGORIES = {
  'governance': 'Municipal governance and decision-making processes',
  'service_delivery': 'Citizen service delivery and support',
  'administration': 'Administrative and document management',
  'compliance': 'Regulatory compliance and risk management',
  'finance': 'Financial management and procurement',
  'planning': 'Urban planning and development',
  'infrastructure': 'Infrastructure and maintenance'
};

/**
 * Initialize all municipal workflow templates
 */
export function initializeMunicipalWorkflows(workflowEngine: any): void {
  Object.values(MUNICIPAL_WORKFLOW_TEMPLATES).forEach(template => {
    workflowEngine.registerTemplate(template);
  });
}