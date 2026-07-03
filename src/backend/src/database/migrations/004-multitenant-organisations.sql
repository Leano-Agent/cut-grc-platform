-- ============================================
-- Ngome Platform - Multi-Tenant Phase 1
-- ============================================
-- Migration 004: Organisations table + org_id on all data tables
-- Run: psql -h <host> -d <db> -f 004-multitenant-organisations.sql

BEGIN;

-- ============================================
-- 1. ORGANISATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS organisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    logo_url TEXT,
    primary_color VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    max_users INTEGER DEFAULT 50,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. SEED DEFAULT "CUT" ORGANISATION
-- ============================================
INSERT INTO organisations (id, name, slug, subscription_tier, max_users)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Central University of Technology',
    'cut',
    'enterprise',
    1000
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 3. ADD organisation_id TO USERS TABLE
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS org_role VARCHAR(50) DEFAULT 'member';

-- Drop the old unique email constraint (it will be replaced by composite unique)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Assign all existing users to the default CUT organisation
UPDATE users SET organisation_id = '00000000-0000-0000-0000-000000000001'
WHERE organisation_id IS NULL;

-- Now make organisation_id NOT NULL and add composite unique index
ALTER TABLE users ALTER COLUMN organisation_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_org_email ON users(organisation_id, email);

-- ============================================
-- 4. ADD organisation_id TO ALL DATA TABLES
-- ============================================

-- Risks
ALTER TABLE risks ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE risks SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE risks ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_risks_org ON risks(organisation_id);

-- Risk Assessments
ALTER TABLE risk_assessments ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE risk_assessments SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE risk_assessments ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_risk_assessments_org ON risk_assessments(organisation_id);

-- Risk Treatment Actions
ALTER TABLE risk_treatment_actions ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE risk_treatment_actions SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE risk_treatment_actions ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_risk_treatment_actions_org ON risk_treatment_actions(organisation_id);

-- Risk Relationships
ALTER TABLE risk_relationships ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE risk_relationships SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE risk_relationships ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_risk_relationships_org ON risk_relationships(organisation_id);

-- Compliance Requirements
ALTER TABLE compliance_requirements ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE compliance_requirements SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE compliance_requirements ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_org ON compliance_requirements(organisation_id);

-- Compliance Evidence
ALTER TABLE compliance_evidence ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE compliance_evidence SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE compliance_evidence ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_compliance_evidence_org ON compliance_evidence(organisation_id);

-- Internal Controls
ALTER TABLE internal_controls ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE internal_controls SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE internal_controls ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_internal_controls_org ON internal_controls(organisation_id);

-- Control Testing Results
ALTER TABLE control_testing_results ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE control_testing_results SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE control_testing_results ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_control_testing_results_org ON control_testing_results(organisation_id);

-- Documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE documents SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE documents ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organisation_id);

-- Workflow Instances
ALTER TABLE workflow_instances ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE workflow_instances SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE workflow_instances ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_instances_org ON workflow_instances(organisation_id);

-- Workflow Step Instances
ALTER TABLE workflow_step_instances ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE workflow_step_instances SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE workflow_step_instances ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_step_instances_org ON workflow_step_instances(organisation_id);

-- Audit Logs
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE audit_logs SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE audit_logs ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organisation_id);

-- Notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE notifications SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE notifications ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organisation_id);

-- Scheduled Reports
ALTER TABLE scheduled_reports ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE scheduled_reports SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE scheduled_reports ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_org ON scheduled_reports(organisation_id);

-- Stakeholder Submissions
ALTER TABLE stakeholder_submissions ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE stakeholder_submissions SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE stakeholder_submissions ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholder_submissions_org ON stakeholder_submissions(organisation_id);

-- Stakeholder Tokens
ALTER TABLE stakeholder_tokens ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE stakeholder_tokens SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE stakeholder_tokens ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholder_tokens_org ON stakeholder_tokens(organisation_id);

-- Sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
UPDATE sessions SET organisation_id = '00000000-0000-0000-0000-000000000001' WHERE organisation_id IS NULL;
ALTER TABLE sessions ALTER COLUMN organisation_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_org ON sessions(organisation_id);

-- ============================================
-- 5. UPDATE _migrations TABLE (already has organisation_id? No — it's a system table, skip)
-- ============================================

COMMIT;
