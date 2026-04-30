-- ============================================
-- COMPLETION OF MUNICIPAL WORKFLOWS MIGRATION
-- ============================================

-- Continue from previous file...

  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  action_required BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Indexes for notifications
CREATE INDEX idx_workflow_notifications_recipient ON workflow_notifications(recipient_id);
CREATE INDEX idx_workflow_notifications_status ON workflow_notifications(status);
CREATE INDEX idx_workflow_notifications_workflow ON workflow_notifications(workflow_instance_id);
CREATE INDEX idx_workflow_notifications_created_at ON workflow_notifications(created_at);
CREATE INDEX idx_workflow_notifications_expires ON workflow_notifications(expires_at);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipal_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipal_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- WORKFLOW INSTANCES RLS POLICIES
-- ============================================

-- Users can see workflows they created
CREATE POLICY workflow_instances_select_own ON workflow_instances FOR SELECT
  USING (created_by = current_setting('app.current_user_id', true)::UUID);

-- Users can see workflows assigned to them
CREATE POLICY workflow_instances_select_assigned ON workflow_instances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_assignments wa
      WHERE wa.workflow_instance_id = workflow_instances.id
      AND wa.assigned_to = current_setting('app.current_user_id', true)::UUID
    )
  );

-- Department heads can see workflows in their department
CREATE POLICY workflow_instances_select_department ON workflow_instances FOR SELECT
  USING (
    department = current_setting('app.current_user_department', true) OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id', true)::UUID
      AND u.role IN ('admin', 'municipal_manager', 'department_head')
    )
  );

-- ============================================
-- SERVICE REQUESTS RLS POLICIES
-- ============================================

-- Citizens can see their own service requests
CREATE POLICY service_requests_select_own ON service_requests FOR SELECT
  USING (
    citizen_id = current_setting('app.current_user_id', true)::UUID OR
    contact_email = current_setting('app.current_user_email', true)
  );

-- Municipal staff can see requests in their department
CREATE POLICY service_requests_select_department ON service_requests FOR SELECT
  USING (
    assigned_department_id IN (
      SELECT id FROM municipal_departments 
      WHERE department_code = current_setting('app.current_user_department', true)
    ) OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id', true)::UUID
      AND u.role IN ('admin', 'customer_service', 'department_manager')
    )
  );

-- ============================================
-- COUNCIL MEETINGS RLS POLICIES
-- ============================================

-- Council members can see all meetings
CREATE POLICY council_meetings_select_council ON council_meetings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id', true)::UUID
      AND u.role IN ('admin', 'mayor', 'councilor', 'council_secretary')
    )
  );

-- Public can see published meetings
CREATE POLICY council_meetings_select_public ON council_meetings FOR SELECT
  USING (status IN ('completed', 'agenda_approved') AND metadata->>'is_public' = 'true');

-- ============================================
-- DOCUMENT WORKFLOWS RLS POLICIES
-- ============================================

-- Document owners can see their documents
CREATE POLICY document_workflows_select_own ON document_workflows FOR SELECT
  USING (owner_id = current_setting('app.current_user_id', true)::UUID);

-- Department members can see department documents
CREATE POLICY document_workflows_select_department ON document_workflows FOR SELECT
  USING (
    department_id IN (
      SELECT id FROM municipal_departments 
      WHERE department_code = current_setting('app.current_user_department', true)
    ) OR
    confidentiality_level IN ('public', 'internal')
  );

-- ============================================
-- COMPLIANCE RECORDS RLS POLICIES
-- ============================================

-- Compliance officers can see all records
CREATE POLICY compliance_records_select_compliance ON compliance_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('app.current_user_id', true)::UUID
      AND u.role IN ('admin', 'compliance_officer', 'data_protection_officer')
    )
  );

-- Department heads can see their department's records
CREATE POLICY compliance_records_select_department ON compliance_records FOR SELECT
  USING (
    department_id IN (
      SELECT id FROM municipal_departments 
      WHERE department_code = current_setting('app.current_user_department', true)
    )
  );

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Create triggers for all new tables
CREATE TRIGGER update_workflow_templates_updated_at BEFORE UPDATE ON workflow_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_instances_updated_at BEFORE UPDATE ON workflow_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_municipal_roles_updated_at BEFORE UPDATE ON municipal_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_municipal_departments_updated_at BEFORE UPDATE ON municipal_departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_council_meetings_updated_at BEFORE UPDATE ON council_meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_agenda_items_updated_at BEFORE UPDATE ON meeting_agenda_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_workflows_updated_at BEFORE UPDATE ON document_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_records_updated_at BEFORE UPDATE ON compliance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_audit_trails_updated_at BEFORE UPDATE ON compliance_audit_trails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS FOR WORKFLOW MANAGEMENT
-- ============================================

-- Function to generate service request number
CREATE OR REPLACE FUNCTION generate_service_request_number()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  year_prefix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(SUBSTRING(request_number FROM '^SR-(\d{4})-(\d+)$')::INTEGER), 0) + 1
  INTO sequence_num
  FROM service_requests
  WHERE request_number LIKE 'SR-' || year_prefix || '-%';
  
  NEW.request_number := 'SR-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_service_request_number_trigger BEFORE INSERT ON service_requests
  FOR EACH ROW WHEN (NEW.request_number IS NULL)
  EXECUTE FUNCTION generate_service_request_number();

-- Function to generate council meeting number
CREATE OR REPLACE FUNCTION generate_council_meeting_number()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  year_prefix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(SUBSTRING(meeting_number FROM '^CM-(\d{4})-(\d+)$')::INTEGER), 0) + 1
  INTO sequence_num
  FROM council_meetings
  WHERE meeting_number LIKE 'CM-' || year_prefix || '-%';
  
  NEW.meeting_number := 'CM-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_council_meeting_number_trigger BEFORE INSERT ON council_meetings
  FOR EACH ROW WHEN (NEW.meeting_number IS NULL)
  EXECUTE FUNCTION generate_council_meeting_number();

-- Function to generate document number
CREATE OR REPLACE FUNCTION generate_document_number()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  year_prefix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(SUBSTRING(document_number FROM '^DOC-(\d{4})-(\d+)$')::INTEGER), 0) + 1
  INTO sequence_num
  FROM document_workflows
  WHERE document_number LIKE 'DOC-' || year_prefix || '-%';
  
  NEW.document_number := 'DOC-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_document_number_trigger BEFORE INSERT ON document_workflows
  FOR EACH ROW WHEN (NEW.document_number IS NULL)
  EXECUTE FUNCTION generate_document_number();

-- Function to check SLA status
CREATE OR REPLACE FUNCTION check_service_request_sla()
RETURNS TRIGGER AS $$
BEGIN
  -- If SLA target is passed and status is not completed/cancelled, mark as breached
  IF NEW.sla_target < CURRENT_TIMESTAMP 
     AND NEW.status NOT IN ('completed', 'cancelled') 
     AND NEW.sla_breach_at IS NULL THEN
    NEW.sla_breach_at := CURRENT_TIMESTAMP;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_service_request_sla_trigger BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION check_service_request_sla();

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- View for workflow dashboard
CREATE VIEW workflow_dashboard AS
SELECT 
  wi.id,
  wi.title,
  wi.workflow_type,
  wi.status,
  wi.priority,
  wi.current_step,
  wi.created_at,
  wi.due_date,
  u.first_name || ' ' || u.last_name as created_by_name,
  wt.name as template_name,
  COUNT(DISTINCT wa.id) as action_count,
  COUNT(DISTINCT wn.id) as notification_count
FROM workflow_instances wi
LEFT JOIN users u ON wi.created_by = u.id
LEFT JOIN workflow_templates wt ON wi.workflow_template_id = wt.id
LEFT JOIN workflow_actions wa ON wi.id = wa.workflow_instance_id
LEFT JOIN workflow_notifications wn ON wi.id = wn.workflow_instance_id
GROUP BY wi.id, wi.title, wi.workflow_type, wi.status, wi.priority, wi.current_step, 
         wi.created_at, wi.due_date, u.first_name, u.last_name, wt.name;

-- View for service request dashboard
CREATE VIEW service_request_dashboard AS
SELECT 
  sr.id,
  sr.request_number,
  sr.service_type,
  sr.service_category,
  sr.priority,
  sr.status,
  sr.submitted_at,
  sr.sla_target,
  sr.sla_breach_at,
  sr.completed_at,
  sr.feedback_score,
  md.department_name,
  u.first_name || ' ' || u.last_name as assigned_to_name,
  EXTRACT(EPOCH FROM (COALESCE(sr.completed_at, CURRENT_TIMESTAMP) - sr.submitted_at)) / 3600 as hours_to_completion
FROM service_requests sr
LEFT JOIN municipal_departments md ON sr.assigned_department_id = md.id
LEFT JOIN users u ON sr.assigned_to = u.id;

-- View for council meeting dashboard
CREATE VIEW council_meeting_dashboard AS
SELECT 
  cm.id,
  cm.meeting_number,
  cm.meeting_type,
  cm.title,
  cm.status,
  cm.scheduled_date,
  cm.location,
  chair.first_name || ' ' || chair.last_name as chairperson_name,
  sec.first_name || ' ' || sec.last_name as secretary_name,
  COUNT(DISTINCT mai.id) as agenda_item_count,
  COUNT(DISTINCT mai.id) FILTER (WHERE mai.status = 'completed') as completed_items
FROM council_meetings cm
LEFT JOIN users chair ON cm.chairperson_id = chair.id
LEFT JOIN users sec ON cm.secretary_id = sec.id
LEFT JOIN meeting_agenda_items mai ON cm.id = mai.council_meeting_id
GROUP BY cm.id, cm.meeting_number, cm.meeting_type, cm.title, cm.status, cm.scheduled_date, 
         cm.location, chair.first_name, chair.last_name, sec.first_name, sec.last_name;

-- View for compliance dashboard
CREATE VIEW compliance_dashboard AS
SELECT 
  cr.id,
  cr.record_type,
  cr.title,
  cr.compliance_status,
  cr.data_category,
  cr.retention_period_years,
  cr.legal_hold,
  cr.next_audit_date,
  md.department_name,
  u.first_name || ' ' || u.last_name as responsible_officer,
  COUNT(DISTINCT cat.id) as audit_count,
  MAX(cat.audit_date) as last_audit_date
FROM compliance_records cr
LEFT JOIN municipal_departments md ON cr.department_id = md.id
LEFT JOIN users u ON cr.responsible_officer_id = u.id
LEFT JOIN compliance_audit_trails cat ON cr.id = cat.compliance_record_id
GROUP BY cr.id, cr.record_type, cr.title, cr.compliance_status, cr.data_category, 
         cr.retention_period_years, cr.legal_hold, cr.next_audit_date, 
         md.department_name, u.first_name, u.last_name;

-- ============================================
-- SEED DATA FOR MUNICIPAL ROLES
-- ============================================

INSERT INTO municipal_roles (role_code, role_name, description, permissions) VALUES
('mayor', 'Municipal Mayor', 'Head of municipal council', '["approve_agendas", "chair_meetings", "sign_resolutions", "represent_municipality"]'),
('councilor', 'Municipal Councilor', 'Elected council member', '["attend_meetings", "vote_resolutions", "represent_ward", "review_documents"]'),
('council_secretary', 'Council Secretary', 'Administrative support for council', '["schedule_meetings", "prepare_agendas", "record_minutes", "distribute_documents"]'),
('municipal_manager', 'Municipal Manager', 'Chief administrative officer', '["manage_departments", "approve_budgets", "implement_policies", "oversay_operations"]'),
('committee_chair', 'Committee Chairperson', 'Chair of municipal committee', '["chair_committee", "approve_recommendations", "report_to_council"]'),
('committee_secretary', 'Committee Secretary', 'Administrative support for committee', '["schedule_meetings", "prepare_minutes", "coordinate_members"]'),
('committee_member', 'Committee Member', 'Member of municipal committee', '["attend_meetings", "review_documents", "provide_input"]'),
('department_head', 'Department Head', 'Head of municipal department', '["manage_department", "approve_workflows", "allocate_resources"]'),
('customer_service', 'Customer Service Officer', 'Frontline service delivery', '["receive_requests", "provide_information", "escalate_issues"]'),
('department_manager', 'Department Manager', 'Manager within department', '["assign_tasks", "monitor_sla", "approve_work"]'),
('service_agent', 'Service Delivery Agent', 'Field service provider', '["execute_services", "report_progress", "complete_tasks"]'),
('quality_assurance', 'Quality Assurance Officer', 'Service quality monitoring', '["audit_services", "verify_quality", "provide_feedback"]'),
('document_owner', 'Document Owner', 'Owner/creator of document', '["create_documents", "submit_for_review", "publish_documents"]'),
('reviewer', 'Document Reviewer', 'Technical reviewer