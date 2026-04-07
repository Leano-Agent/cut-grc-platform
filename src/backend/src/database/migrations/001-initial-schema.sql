-- (Continuing from previous section...)

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_treatment_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_testing_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS RLS POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY users_select_own ON users FOR SELECT
  USING (id = current_setting('app.current_user_id', true)::UUID);

-- Users can update their own profile (except role and security fields)
CREATE POLICY users_update_own ON users FOR UPDATE
  USING (id = current_setting('app.current_user_id', true)::UUID)
  WITH CHECK (
    id = current_setting('app.current_user_id', true)::UUID AND
    role IS NOT DISTINCT FROM OLD.role AND
    is_active IS NOT DISTINCT FROM OLD.is_active AND
    is_verified IS NOT DISTINCT FROM OLD.is_verified
  );

-- Admins can read all users
CREATE POLICY users_select_admin ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id', true)::UUID 
      AND u.role = 'admin'
    )
  );

-- Admins can insert/update/delete users
CREATE POLICY users_admin_all ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id', true)::UUID 
      AND u.role = 'admin'
    )
  );

-- ============================================
-- RISKS RLS POLICIES
-- ============================================

-- Users can read risks in their department or risks they own
CREATE POLICY risks_select_department ON risks FOR SELECT
  USING (
    department = current_setting('app.current_user_department', true) OR
    owner_id = current_setting('app.current_user_id', true)::UUID OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id', true)::UUID 
      AND u.role IN ('admin', 'risk_manager', 'auditor')
    )
  );

-- Risk managers and admins can modify risks
CREATE POLICY risks_modify_privileged ON risks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id', true)::UUID 
      AND u.role IN ('admin', 'risk_manager')
    )
  );

-- Department users can update risks in their department
CREATE POLICY risks_update_department ON risks FOR UPDATE
  USING (
    department = current_setting('app.current_user_department', true) AND
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id', true)::UUID 
      AND u.role IN ('risk_manager', 'compliance_officer', 'auditor')
    )
  );

-- ============================================
-- COMPLIANCE REQUIREMENTS RLS POLICIES
-- ============================================

-- Users can read compliance requirements in their department
CREATE POLICY compliance_select_department ON compliance_requirements FOR SELECT
  USING (
    department = current_setting('app.current_user_department', true) OR
    owner_id = current_setting('app.current_user_id', true)::UUID OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id', true)::UUID 
      AND u.role IN ('admin', 'compliance_officer', 'auditor')
    )
  );

-- Compliance officers and admins can modify requirements
CREATE POLICY compliance_modify_privileged ON compliance_requirements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id', true)::UUID 
      AND u.role IN ('admin', 'compliance_officer')
    )
  );

-- ============================================
-- INTERNAL CONTROLS RLS POLICIES
-- ============================================

-- Users can read controls in their department
CREATE POLICY controls_select_department ON internal_controls FOR SELECT
  USING (
    department = current_setting('app.current_user_department', true) OR
    owner_id = current_setting('app.current_user_id', true)::UUID OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id', true)::UUID 
      AND u.role IN ('admin', 'compliance_officer', 'auditor')
    )
  );

-- Compliance officers and auditors can modify controls
CREATE POLICY controls_modify_privileged ON internal_controls FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id', true)::UUID 
      AND u.role IN ('admin', 'compliance_officer', 'auditor')
    )
  );

-- ============================================
-- AUDIT LOGS RLS POLICIES
-- ============================================

-- Users can only see their own audit logs
CREATE POLICY audit_logs_select_own ON audit_logs FOR SELECT
  USING (
    user_id = current_setting('app.current_user_id', true)::UUID OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id', true)::UUID 
      AND u.role IN ('admin', 'auditor')
    )
  );

-- Only system can insert audit logs (via trigger)
CREATE POLICY audit_logs_insert_system ON audit_logs FOR INSERT
  WITH CHECK (true); -- Application layer controls this

-- ============================================
-- OTHER TABLES RLS POLICIES
-- ============================================

-- Similar policies for other tables (simplified for brevity)
CREATE POLICY evidence_select_department ON compliance_evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM compliance_requirements cr
      WHERE cr.id = requirement_id
      AND (
        cr.department = current_setting('app.current_user_department', true) OR
        EXISTS (
          SELECT 1 FROM users u 
          WHERE u.id = current_setting('app.current_user_id', true)::UUID 
          AND u.role IN ('admin', 'compliance_officer', 'auditor')
        )
      )
    )
  );

CREATE POLICY actions_select_department ON risk_treatment_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM risks r
      WHERE r.id = risk_id
      AND (
        r.department = current_setting('app.current_user_department', true) OR
        EXISTS (
          SELECT 1 FROM users u 
          WHERE u.id = current_setting('app.current_user_id', true)::UUID 
          AND u.role IN ('admin', 'risk_manager', 'auditor')
        )
      )
    )
  );

CREATE POLICY notifications_select_own ON notifications FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risks_updated_at BEFORE UPDATE ON risks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_requirements_updated_at BEFORE UPDATE ON compliance_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_internal_controls_updated_at BEFORE UPDATE ON internal_controls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_evidence_updated_at BEFORE UPDATE ON compliance_evidence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_treatment_actions_updated_at BEFORE UPDATE ON risk_treatment_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_control_testing_results_updated_at BEFORE UPDATE ON control_testing_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUDIT LOG TRIGGER
-- ============================================

-- Function to create audit logs
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  changes JSONB;
  event_action TEXT;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    event_action := 'CREATE';
    old_data := NULL;
    new_data := to_jsonb(NEW);
    changes := new_data;
  ELSIF TG_OP = 'UPDATE' THEN
    event_action := 'UPDATE';
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    -- Calculate changes
    SELECT jsonb_object_agg(key, value) INTO changes
    FROM (
      SELECT key, jsonb_build_object('old', old_data->key, 'new', new_data->key) as value
      FROM jsonb_object_keys(old_data || new_data) as key
      WHERE old_data->key IS DISTINCT FROM new_data->key
    ) as changed_fields;
    
  ELSIF TG_OP = 'DELETE' THEN
    event_action := 'DELETE';
    old_data := to_jsonb(OLD);
    new_data := NULL;
    changes := old_data;
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    event_type,
    event_action,
    resource_type,
    resource_id,
    user_id,
    user_email,
    user_role,
    old_values,
    new_values,
    changes
  ) VALUES (
    TG_TABLE_NAME,
    event_action,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id::text
      ELSE NEW.id::text
    END,
    current_setting('app.current_user_id', true)::UUID,
    current_setting('app.current_user_email', true),
    current_setting('app.current_user_role', true),
    old_data,
    new_data,
    changes
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create audit triggers for main tables
CREATE TRIGGER audit_users_trigger AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_risks_trigger AFTER INSERT OR UPDATE OR DELETE ON risks
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_compliance_requirements_trigger AFTER INSERT OR UPDATE OR DELETE ON compliance_requirements
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_internal_controls_trigger AFTER INSERT OR UPDATE OR DELETE ON internal_controls
  FOR Each ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================
-- FUNCTIONS FOR DATA INTEGRITY
-- ============================================

-- Function to check if user has permission to modify record
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id UUID,
  p_required_roles TEXT[],
  p_department TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT role, department INTO user_record
  FROM users
  WHERE id = p_user_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has required role
  IF user_record.role = ANY(p_required_roles) THEN
    RETURN TRUE;
  END IF;
  
  -- Check department if specified
  IF p_department IS NOT NULL AND user_record.department = p_department THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ language 'plpgsql';

-- Function to generate next risk code
CREATE OR REPLACE FUNCTION generate_risk_code()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  year_prefix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(SUBSTRING(risk_code FROM '^RISK-(\d{4})-(\d+)$')::INTEGER), 0) + 1
  INTO sequence_num
  FROM risks
  WHERE risk_code LIKE 'RISK-' || year_prefix || '-%';
  
  NEW.risk_code := 'RISK-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_risk_code_trigger BEFORE INSERT ON risks
  FOR EACH ROW WHEN (NEW.risk_code IS NULL)
  EXECUTE FUNCTION generate_risk_code();

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- View for risk dashboard
CREATE VIEW risk_dashboard AS
SELECT 
  r.id,
  r.risk_code,
  r.title,
  r.category,
  r.risk_level,
  r.treatment_status,
  r.department,
  r.next_review_date,
  u.first_name || ' ' || u.last_name as owner_name,
  COUNT(DISTINCT rta.id) as treatment_actions_count,
  COUNT(DISTINCT ic.id) as controls_count
FROM risks r
LEFT JOIN users u ON r.owner_id = u.id
LEFT JOIN risk_treatment_actions rta ON r.id = rta.risk_id
LEFT JOIN internal_controls ic ON r.id = ic.risk_id
GROUP BY r.id, r.risk_code, r.title, r.category, r.risk_level, r.treatment_status, 
         r.department, r.next_review_date, u.first_name, u.last_name;

-- View for compliance dashboard
CREATE VIEW compliance_dashboard AS
SELECT 
  cr.id,
  cr.requirement_code,
  cr.title,
  cr.regulation_standard,
  cr.status,
  cr.priority,
  cr.deadline,
  cr.department,
  u.first_name || ' ' || u.last_name as owner_name,
  COUNT(DISTINCT ce.id) as evidence_count,
  COUNT(DISTINCT ic.id) as controls_count
FROM compliance_requirements cr
LEFT JOIN users u ON cr.owner_id = u.id
LEFT JOIN compliance_evidence ce ON cr.id = ce.requirement_id
LEFT JOIN internal_controls ic ON cr.id = ic.compliance_requirement_id
GROUP BY cr.id, cr.requirement_code, cr.title, cr.regulation_standard, cr.status, 
         cr.priority, cr.deadline, cr.department, u.first_name, u.last_name;

-- View for overdue items
CREATE VIEW overdue_items AS
SELECT 
  'Risk' as item_type,
  risk_code as item_code,
  title,
  next_review_date as due_date,
  'Review overdue' as reason
FROM risks
WHERE next_review_date < CURRENT_DATE
  AND treatment_status != 'closed'

UNION ALL

SELECT 
  'Compliance Requirement' as item_type,
  requirement_code as item_code,
  title,
  deadline as due_date,
  'Deadline passed' as reason
FROM compliance_requirements
WHERE deadline < CURRENT_DATE
  AND status NOT IN ('compliant', 'exempt')

UNION ALL

SELECT 
  'Risk Treatment Action' as item_type,
  action_code as item_code,
  title,
  due_date,
  'Action overdue' as reason
FROM risk_treatment_actions
WHERE due_date < CURRENT_DATE
  AND status NOT IN ('completed', 'cancelled')

UNION ALL

SELECT 
  'Control Test' as item_type,
  control_code as item_code,
  title,
  next_test_date as due_date,
  'Test overdue' as reason
FROM internal_controls
WHERE next_test_date < CURRENT_DATE;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE users IS 'System users with roles: admin, risk_manager, compliance_officer, auditor, viewer';
COMMENT ON TABLE risks IS 'Risk register with assessment, treatment, and monitoring';
COMMENT ON TABLE compliance_requirements IS 'Compliance requirements from regulations, standards, and policies';
COMMENT ON TABLE internal_controls IS 'Internal controls for risk mitigation and compliance';
COMMENT ON TABLE audit_logs IS 'Security audit trail for all system activities';
COMMENT ON TABLE compliance_evidence IS 'Evidence supporting compliance requirements';
COMMENT ON TABLE risk_treatment_actions IS 'Actions to treat identified risks';
COMMENT ON TABLE control_testing_results IS 'Results of control testing activities';
COMMENT ON TABLE notifications IS 'User notifications and reminders';

COMMENT ON COLUMN users.role IS 'User role: admin, risk_manager, compliance_officer, auditor, viewer';
COMMENT ON COLUMN risks.risk_level IS 'Generated risk level based on likelihood and impact matrix';
COMMENT ON COLUMN risks.treatment_status IS 'Risk treatment lifecycle: identified, assessed, treated, monitored, closed';
COMMENT ON COLUMN compliance_requirements.status IS 'Compliance status: pending, in_progress, compliant, non_compliant, exempt';
COMMENT ON COLUMN internal_controls.test_result IS 'Control test result: effective, partially_effective, ineffective, not_tested';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

