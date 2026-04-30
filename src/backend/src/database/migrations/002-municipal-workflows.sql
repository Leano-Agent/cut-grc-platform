-- ============================================
-- MUNICIPAL WORKFLOWS MIGRATION
-- ============================================
-- Migration: 002-municipal-workflows.sql
-- Description: Creates tables for municipal workflow management
-- ============================================

-- ============================================
-- WORKFLOW TEMPLATES TABLE
-- ============================================
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  steps JSONB NOT NULL,
  default_priority VARCHAR(20) NOT NULL CHECK (default_priority IN ('low', 'medium', 'high', 'critical')),
  default_sla JSONB,
  roles JSONB NOT NULL, -- Array of roles that can initiate this workflow
  metadata JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_template_name_version UNIQUE (name, version)
);

-- Index for category filtering
CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX idx_workflow_templates_active ON workflow_templates(is_active);

-- ============================================
-- WORKFLOW INSTANCES TABLE
-- ============================================
CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE RESTRICT,
  workflow_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  current_step INTEGER NOT NULL DEFAULT 0,
  steps JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP WITH TIME ZONE,
  sla JSONB,
  metadata JSONB,
  
  -- Department/unit context
  department VARCHAR(100),
  municipal_ward VARCHAR(50),
  
  CONSTRAINT valid_current_step CHECK (current_step >= 0)
);

-- Indexes for performance
CREATE INDEX idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX idx_workflow_instances_created_by ON workflow_instances(created_by);
CREATE INDEX idx_workflow_instances_due_date ON workflow_instances(due_date);
CREATE INDEX idx_workflow_instances_department ON workflow_instances(department);
CREATE INDEX idx_workflow_instances_workflow_type ON workflow_instances(workflow_type);
CREATE INDEX idx_workflow_instances_created_at ON workflow_instances(created_at);

-- ============================================
-- WORKFLOW ACTIONS TABLE
-- ============================================
CREATE TABLE workflow_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  step_id VARCHAR(100) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  performed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  comments TEXT,
  metadata JSONB,
  
  -- For quick lookups
  user_role VARCHAR(50) NOT NULL,
  user_email VARCHAR(255) NOT NULL
);

-- Indexes for action history queries
CREATE INDEX idx_workflow_actions_instance ON workflow_actions(workflow_instance_id);
CREATE INDEX idx_workflow_actions_performed_by ON workflow_actions(performed_by);
CREATE INDEX idx_workflow_actions_performed_at ON workflow_actions(performed_at);
CREATE INDEX idx_workflow_actions_step ON workflow_actions(step_id);

-- ============================================
-- WORKFLOW ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE workflow_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  step_id VARCHAR(100) NOT NULL,
  assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'escalated')),
  completed_at TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  
  CONSTRAINT unique_step_assignment UNIQUE (workflow_instance_id, step_id)
);

-- Indexes for assignment tracking
CREATE INDEX idx_workflow_assignments_assigned_to ON workflow_assignments(assigned_to);
CREATE INDEX idx_workflow_assignments_status ON workflow_assignments(status);
CREATE INDEX idx_workflow_assignments_due_date ON workflow_assignments(due_date);

-- ============================================
-- MUNICIPAL ROLES TABLE
-- ============================================
CREATE TABLE municipal_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code VARCHAR(50) NOT NULL UNIQUE,
  role_name VARCHAR(100) NOT NULL,
  description TEXT,
  department VARCHAR(100),
  permissions JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for role lookups
CREATE INDEX idx_municipal_roles_department ON municipal_roles(department);
CREATE INDEX idx_municipal_roles_active ON municipal_roles(is_active);

-- ============================================
-- MUNICIPAL DEPARTMENTS TABLE
-- ============================================
CREATE TABLE municipal_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_code VARCHAR(50) NOT NULL UNIQUE,
  department_name VARCHAR(200) NOT NULL,
  description TEXT,
  parent_department_id UUID REFERENCES municipal_departments(id) ON DELETE SET NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for hierarchical queries
CREATE INDEX idx_municipal_departments_parent ON municipal_departments(parent_department_id);
CREATE INDEX idx_municipal_departments_active ON municipal_departments(is_active);

-- ============================================
-- SERVICE REQUESTS TABLE
-- ============================================
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) NOT NULL UNIQUE,
  citizen_id VARCHAR(100), -- Could be ID number, email, or anonymous
  citizen_name VARCHAR(200),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  service_type VARCHAR(100) NOT NULL,
  service_category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('submitted', 'acknowledged', 'assigned', 'in_progress', 'completed', 'cancelled', 'escalated')),
  assigned_department_id UUID REFERENCES municipal_departments(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  sla_target TIMESTAMP WITH TIME ZONE,
  sla_breach_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
  feedback_comments TEXT,
  metadata JSONB,
  
  -- For reporting
  municipal_ward VARCHAR(50),
  coordinates POINT -- For GIS integration
);

-- Indexes for service request management
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_assigned_to ON service_requests(assigned_to);
CREATE INDEX idx_service_requests_department ON service_requests(assigned_department_id);
CREATE INDEX idx_service_requests_submitted_at ON service_requests(submitted_at);
CREATE INDEX idx_service_requests_service_type ON service_requests(service_type);
CREATE INDEX idx_service_requests_municipal_ward ON service_requests(municipal_ward);
CREATE INDEX idx_service_requests_request_number ON service_requests(request_number);

-- ============================================
-- COUNCIL MEETINGS TABLE
-- ============================================
CREATE TABLE council_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_number VARCHAR(50) NOT NULL UNIQUE,
  meeting_type VARCHAR(50) NOT NULL CHECK (meeting_type IN ('ordinary', 'special', 'committee', 'extraordinary')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  location VARCHAR(200),
  status VARCHAR(20) NOT NULL CHECK (status IN ('scheduled', 'agenda_preparation', 'agenda_approved', 'in_progress', 'adjourned', 'completed', 'cancelled')),
  quorum_required INTEGER,
  quorum_achieved INTEGER,
  chairperson_id UUID REFERENCES users(id) ON DELETE SET NULL,
  secretary_id UUID REFERENCES users(id) ON DELETE SET NULL,
  agenda_document_url TEXT,
  minutes_document_url TEXT,
  recording_url TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Indexes for council meetings
CREATE INDEX idx_council_meetings_scheduled_date ON council_meetings(scheduled_date);
CREATE INDEX idx_council_meetings_status ON council_meetings(status);
CREATE INDEX idx_council_meetings_type ON council_meetings(meeting_type);
CREATE INDEX idx_council_meetings_created_by ON council_meetings(created_by);

-- ============================================
-- MEETING AGENDA ITEMS TABLE
-- ============================================
CREATE TABLE meeting_agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  council_meeting_id UUID NOT NULL REFERENCES council_meetings(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('information', 'decision', 'discussion', 'report')),
  presenter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  duration_minutes INTEGER,
  documents JSONB, -- Array of document URLs
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'presented', 'completed')),
  decision TEXT,
  voting_result VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_meeting_item_number UNIQUE (council_meeting_id, item_number)
);

-- Indexes for agenda items
CREATE INDEX idx_agenda_items_meeting ON meeting_agenda_items(council_meeting_id);
CREATE INDEX idx_agenda_items_presenter ON meeting_agenda_items(presenter_id);
CREATE INDEX idx_agenda_items_status ON meeting_agenda_items(status);

-- ============================================
-- DOCUMENT WORKFLOWS TABLE
-- ============================================
CREATE TABLE document_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number VARCHAR(50) NOT NULL UNIQUE,
  document_type VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  current_version INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'review', 'approval', 'approved', 'published', 'archived', 'obsolete')),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES municipal_departments(id) ON DELETE SET NULL,
  confidentiality_level VARCHAR(20) CHECK (confidentiality_level IN ('public', 'internal', 'confidential', 'secret')),
  retention_period_years INTEGER,
  disposal_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Indexes for document workflows
CREATE INDEX idx_document_workflows_status ON document_workflows(status);
CREATE INDEX idx_document_workflows_owner ON document_workflows(owner_id);
CREATE INDEX idx_document_workflows_department ON document_workflows(department_id);
CREATE INDEX idx_document_workflows_document_type ON document_workflows(document_type);

-- ============================================
-- DOCUMENT VERSIONS TABLE
-- ============================================
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES document_workflows(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_label VARCHAR(50),
  file_url TEXT NOT NULL,
  file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for integrity verification
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  change_description TEXT,
  metadata JSONB,
  
  CONSTRAINT unique_document_version UNIQUE (document_id, version_number)
);

-- Indexes for document versions
CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_versions_created_by ON document_versions(created_by);

-- ============================================
-- COMPLIANCE RECORDS TABLE (POPIA)
-- ============================================
CREATE TABLE compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type VARCHAR(50) NOT NULL CHECK (record_type IN ('data_inventory', 'risk_assessment', 'consent_record', 'breach_report', 'audit_trail')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  data_category VARCHAR(100),
  data_subject_type VARCHAR(100),
  retention_period_years INTEGER,
  disposal_date TIMESTAMP WITH TIME ZONE,
  legal_hold BOOLEAN NOT NULL DEFAULT false,
  legal_hold_reason TEXT,
  legal_hold_until TIMESTAMP WITH TIME ZONE,
  popia_principle VARCHAR(50), -- Which POPIA principle applies
  compliance_status VARCHAR(20) NOT NULL CHECK (compliance_status IN ('compliant', 'non_compliant', 'in_progress', 'exempt')),
  responsible_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  department_id UUID REFERENCES municipal_departments(id) ON DELETE SET NULL,
  last_audit_date TIMESTAMP WITH TIME ZONE,
  next_audit_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Indexes for compliance records
CREATE INDEX idx_compliance_records_type ON compliance_records(record_type);
CREATE INDEX idx_compliance_records_status ON compliance_records(compliance_status);
CREATE INDEX idx_compliance_records_department ON compliance_records(department_id);
CREATE INDEX idx_compliance_records_legal_hold ON compliance_records(legal_hold);
CREATE INDEX idx_compliance_records_next_audit ON compliance_records(next_audit_date);

-- ============================================
-- AUDIT TRAILS TABLE
-- ============================================
CREATE TABLE compliance_audit_trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_trail_id VARCHAR(50) NOT NULL UNIQUE,
  compliance_record_id UUID REFERENCES compliance_records(id) ON DELETE CASCADE,
  audit_type VARCHAR(50) NOT NULL,
  audit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  auditor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  findings TEXT,
  recommendations TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  report_url TEXT,
  next_follow_up_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Indexes for audit trails
CREATE INDEX idx_audit_trails_compliance_record ON compliance_audit_trails(compliance_record_id);
CREATE INDEX idx_audit_trails_auditor ON compliance_audit_trails(auditor_id);
CREATE INDEX idx_audit_trails_audit_date ON compliance_audit_trails(audit_date);
CREATE INDEX idx_audit_trails_status ON compliance_audit_trails(status);

-- ============================================
-- NOTIFICATIONS TABLE (Extended for workflows)
-- ============================================
CREATE TABLE workflow_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type VARCHAR(50) NOT NULL,
  workflow_instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending',