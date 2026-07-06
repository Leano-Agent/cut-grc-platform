-- ============================================
-- Migration 003.1: Safe Trigger Function Replacement
-- 
-- Fixes: When 004 does UPDATEs on tables, the old update_updated_at_column()
-- trigger fires on tables that may lack `updated_at` column.
-- This replaces the trigger with a defensive version that checks column existence.
-- ============================================
BEGIN;

-- === 1. Replace update_updated_at_column with defensive version ===
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
DECLARE
    col_exists boolean;
BEGIN
    -- Check if this table actually has updated_at before setting it
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = TG_TABLE_SCHEMA
        AND table_name = TG_TABLE_NAME
        AND column_name = 'updated_at'
    ) INTO col_exists;
    
    IF col_exists THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- === 2. Recreate triggers only on tables that have updated_at ===
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

-- === 3. Replace audit_trigger_function (same ownership issue, already here) ===
DROP FUNCTION IF EXISTS audit_trigger_function CASCADE;
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
