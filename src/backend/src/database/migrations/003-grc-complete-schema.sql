-- ============================================
-- CUT GRC Platform - Complete Database Schema
-- ============================================
-- Migration 003: Full schema with all tables
-- Run: psql -h <host> -d <db> -f 003-grc-complete-schema.sql

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CUSTOM ENUM TYPES
-- ============================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'risk_manager', 'compliance_officer', 'auditor', 'manager', 'staff', 'student', 'faculty');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_severity AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_likelihood AS ENUM ('certain', 'likely', 'possible', 'unlikely', 'rare');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_status AS ENUM ('identified', 'assessed', 'in_treatment', 'monitoring', 'closed', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE control_frequency AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'annually', 'ad_hoc');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE control_type AS ENUM ('preventive', 'detective', 'corrective', 'directive', 'compensating');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE control_status AS ENUM ('draft', 'active', 'testing', 'review', 'inactive', 'failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE compliance_status AS ENUM ('compliant', 'non_compliant', 'partial', 'not_assessed', 'under_review');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('risk_alert', 'compliance_due', 'control_failure', 'approval_needed', 'system');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'APPROVE', 'REJECT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    department VARCHAR(100),
    title VARCHAR(100),
    phone VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ DEFAULT NOW(),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    refresh_token TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RISKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    severity risk_severity DEFAULT 'medium',
    likelihood risk_likelihood DEFAULT 'possible',
    risk_score INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN severity = 'critical' AND likelihood IN ('certain', 'likely') THEN 25
            WHEN severity = 'critical' AND likelihood = 'possible' THEN 20
            WHEN severity = 'high' AND likelihood IN ('certain', 'likely') THEN 20
            WHEN severity = 'high' AND likelihood = 'possible' THEN 15
            WHEN severity = 'medium' AND likelihood IN ('certain', 'likely') THEN 15
            WHEN severity = 'medium' AND likelihood = 'possible' THEN 10
            WHEN severity = 'low' AND likelihood IN ('certain', 'likely') THEN 10
            ELSE 5
        END
    ) STORED,
    status risk_status DEFAULT 'identified',
    department VARCHAR(100),
    owner_id UUID REFERENCES users(id),
    source VARCHAR(100),
    impact_description TEXT,
    root_cause TEXT,
    existing_controls TEXT,
    treatment_strategy VARCHAR(50) CHECK (treatment_strategy IN ('accept', 'mitigate', 'transfer', 'avoid', 'monitor')),
    residual_severity risk_severity,
    residual_likelihood risk_likelihood,
    target_date DATE,
    closed_at TIMESTAMPTZ,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RISK TREATMENT ACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS risk_treatment_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    action_type VARCHAR(50) CHECK (action_type IN ('mitigate', 'transfer', 'accept', 'avoid', 'monitor')),
    priority VARCHAR(20) CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'overdue', 'cancelled')),
    assigned_to UUID REFERENCES users(id),
    start_date DATE,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    cost_estimate DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    completion_notes TEXT,
    evidence_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RISK HIERARCHY (parent-child)
-- ============================================
CREATE TABLE IF NOT EXISTS risk_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
    child_risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) CHECK (relationship_type IN ('causes', 'depends_on', 'aggregates', 'mitigates')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_risk_id, child_risk_id, relationship_type)
);

-- ============================================
-- RISK ASSESSMENT HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
    assessed_by UUID REFERENCES users(id),
    assessed_at TIMESTAMPTZ DEFAULT NOW(),
    severity risk_severity NOT NULL,
    likelihood risk_likelihood NOT NULL,
    risk_score INTEGER,
    assessment_notes TEXT,
    methodology VARCHAR(100) DEFAULT '5x5_matrix',
    next_review_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPLIANCE REQUIREMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    regulation_source VARCHAR(255),
    regulation_section VARCHAR(100),
    category VARCHAR(100),
    department VARCHAR(100),
    owner_id UUID REFERENCES users(id),
    status compliance_status DEFAULT 'not_assessed',
    priority VARCHAR(20) CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    effective_date DATE,
    review_frequency control_frequency DEFAULT 'annually',
    last_reviewed_at TIMESTAMPTZ,
    next_review_date DATE,
    penalty_for_non_compliance TEXT,
    supporting_documents TEXT[],
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPLIANCE EVIDENCE
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requirement_id UUID NOT NULL REFERENCES compliance_requirements(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    evidence_type VARCHAR(50) CHECK (evidence_type IN ('document', 'screenshot', 'log', 'certification', 'audit_report', 'policy', 'training_record')),
    file_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    submitted_by UUID REFERENCES users(id),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    expires_at DATE,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INTERNAL CONTROLS
-- ============================================
CREATE TABLE IF NOT EXISTS internal_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    control_type control_type DEFAULT 'preventive',
    frequency control_frequency DEFAULT 'monthly',
    status control_status DEFAULT 'draft',
    department VARCHAR(100),
    owner_id UUID REFERENCES users(id),
    risk_id UUID REFERENCES risks(id),
    requirement_id UUID REFERENCES compliance_requirements(id),
    design_effectiveness VARCHAR(50) CHECK (design_effectiveness IN ('effective', 'partially_effective', 'ineffective', 'not_designed')),
    operational_effectiveness VARCHAR(50) CHECK (operational_effectiveness IN ('effective', 'partially_effective', 'ineffective', 'not_tested')),
    last_tested_at TIMESTAMPTZ,
    next_test_date DATE,
    automation_level VARCHAR(50) CHECK (automation_level IN ('manual', 'semi_automated', 'fully_automated')),
    control_owner VARCHAR(255),
    evidence_required BOOLEAN DEFAULT false,
    auto_approve BOOLEAN DEFAULT false,
    escalation_threshold INTEGER DEFAULT 3,
    approval_required BOOLEAN DEFAULT true,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTROL TESTING RESULTS
-- ============================================
CREATE TABLE IF NOT EXISTS control_testing_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    control_id UUID NOT NULL REFERENCES internal_controls(id) ON DELETE CASCADE,
    tested_by UUID REFERENCES users(id),
    tested_at TIMESTAMPTZ DEFAULT NOW(),
    result VARCHAR(50) CHECK (result IN ('pass', 'fail', 'partial', 'not_tested', 'not_applicable')),
    effectiveness_rating VARCHAR(50) CHECK (effectiveness_rating IN ('effective', 'partially_effective', 'ineffective')),
    test_type VARCHAR(100),
    test_scope TEXT,
    findings TEXT,
    remediation_notes TEXT,
    next_test_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS (immutable)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action audit_action NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    department VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type DEFAULT 'system',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    entity_type VARCHAR(100),
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    category VARCHAR(100),
    department VARCHAR(100),
    tags TEXT[],
    version INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft', 'under_review')),
    owner_id UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKFLOW INSTANCES
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'completed', 'cancelled', 'escalated')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER,
    initiated_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_step_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    step_index INTEGER NOT NULL,
    name VARCHAR(255),
    type VARCHAR(50),
    role VARCHAR(100),
    assignee_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'failed')),
    actions_taken JSONB DEFAULT '[]',
    notes TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    sla_deadline TIMESTAMPTZ,
    is_overdue BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EXTERNAL STAKEHOLDER TOKENS
-- ============================================
CREATE TABLE IF NOT EXISTS stakeholder_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    purpose VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    expires_at TIMESTAMPTZ NOT NULL,
    max_submissions INTEGER DEFAULT 1,
    submission_count INTEGER DEFAULT 0,
    last_submitted_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAKEHOLDER SUBMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS stakeholder_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID NOT NULL REFERENCES stakeholder_tokens(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    files JSONB DEFAULT '[]',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- ============================================
-- SCHEDULED REPORTS
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(100) CHECK (report_type IN ('risk_summary', 'compliance_status', 'control_effectiveness', 'audit_trail', 'custom')),
    frequency control_frequency DEFAULT 'monthly',
    format VARCHAR(50) DEFAULT 'pdf' CHECK (format IN ('pdf', 'csv', 'xlsx', 'html')),
    recipients TEXT[],
    parameters JSONB DEFAULT '{}',
    last_generated_at TIMESTAMPTZ,
    next_scheduled_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SESSION STORE
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL,
    refresh_token VARCHAR(512),
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_valid BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_risks_status ON risks(status);
CREATE INDEX IF NOT EXISTS idx_risks_severity ON risks(severity);
CREATE INDEX IF NOT EXISTS idx_risks_department ON risks(department);
CREATE INDEX IF NOT EXISTS idx_risks_owner ON risks(owner_id);
CREATE INDEX IF NOT EXISTS idx_risks_category ON risks(category);

CREATE INDEX IF NOT EXISTS idx_requirements_status ON compliance_requirements(status);
CREATE INDEX IF NOT EXISTS idx_requirements_department ON compliance_requirements(department);
CREATE INDEX IF NOT EXISTS idx_requirements_source ON compliance_requirements(regulation_source);

CREATE INDEX IF NOT EXISTS idx_controls_status ON internal_controls(status);
CREATE INDEX IF NOT EXISTS idx_controls_department ON internal_controls(department);
CREATE INDEX IF NOT EXISTS idx_controls_type ON internal_controls(control_type);

CREATE INDEX IF NOT EXISTS idx_actions_status ON risk_treatment_actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_risk ON risk_treatment_actions(risk_id);
CREATE INDEX IF NOT EXISTS idx_actions_assignee ON risk_treatment_actions(assigned_to);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);

CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_workflows_assignee ON workflow_instances(assigned_to);

CREATE INDEX IF NOT EXISTS idx_tokens_expires ON stakeholder_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_tokens_email ON stakeholder_tokens(email);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_risks_updated_at BEFORE UPDATE ON risks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_requirements_updated_at BEFORE UPDATE ON compliance_requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_controls_updated_at BEFORE UPDATE ON internal_controls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_actions_updated_at BEFORE UPDATE ON risk_treatment_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER: Auto audit log on risk/control changes
-- ============================================
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
        VALUES (current_setting('app.current_user_id', true)::UUID, 'CREATE', TG_TABLE_NAME, NEW.id, row_to_json(NEW), current_setting('app.current_ip', true));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
        VALUES (current_setting('app.current_user_id', true)::UUID, 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW), current_setting('app.current_ip', true));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, ip_address)
        VALUES (current_setting('app.current_user_id', true)::UUID, 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD), current_setting('app.current_ip', true));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_risks AFTER INSERT OR UPDATE OR DELETE ON risks
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_controls AFTER INSERT OR UPDATE OR DELETE ON internal_controls
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_requirements AFTER INSERT OR UPDATE OR DELETE ON compliance_requirements
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

COMMIT;
