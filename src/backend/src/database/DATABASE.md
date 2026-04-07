# CUT GRC Platform Database Documentation

## Overview

This document provides comprehensive documentation for the CUT GRC Platform database schema, including table structures, relationships, indexes, security policies, and maintenance procedures.

## Database Specifications

- **Database System**: PostgreSQL 15+
- **Encoding**: UTF-8
- **Collation**: en_US.UTF-8
- **Timezone**: Africa/Johannesburg (UTC+2)
- **Extensions**: 
  - `uuid-ossp` for UUID generation
  - `pgcrypto` for password hashing
  - `pg_stat_statements` for query monitoring

## Schema Diagram

```
┌─────────────────┐      ┌─────────────────────┐      ┌──────────────────────────┐
│     users       │      │       risks         │      │ compliance_requirements  │
├─────────────────┤      ├─────────────────────┤      ├──────────────────────────┤
│ id (PK)         │◄────┤ owner_id (FK)       │      │ id (PK)                  │
│ email           │      │ risk_code           │      │ requirement_code         │
│ password_hash   │      │ title               │      │ title                    │
│ first_name      │      │ description         │      │ description              │
│ last_name       │      │ category            │      │ regulation_standard      │
│ role            │      │ likelihood          │      │ status                   │
│ department      │      │ impact              │      │ deadline                 │
│ is_active       │      │ risk_level (GEN)    │      │ owner_id (FK)            │
│ ...             │      │ treatment_status    │      │ ...                      │
└─────────────────┘      │ ...                 │      └──────────────────────────┘
        │                └─────────────────────┘                 │
        │                         │                              │
        │                         │                              │
        ▼                         ▼                              ▼
┌─────────────────┐      ┌─────────────────────┐      ┌──────────────────────────┐
│  audit_logs     │      │ internal_controls   │      │ compliance_evidence      │
├─────────────────┤      ├─────────────────────┤      ├──────────────────────────┤
│ id (PK)         │      │ id (PK)             │      │ id (PK)                  │
│ event_type      │      │ control_code        │      │ requirement_id (FK)      │
│ resource_type   │      │ title               │      │ title                    │
│ resource_id     │      │ description         │      │ evidence_type           │
│ user_id (FK)    │      │ control_type        │      │ storage_url              │
│ old_values      │      │ test_result         │      │ uploaded_by (FK)         │
│ new_values      │      │ risk_id (FK)        │      │ ...                      │
│ ...             │      │ compliance_req_id(FK)│     └──────────────────────────┘
└─────────────────┘      │ ...                 │                 │
                         └─────────────────────┘                 │
                                   │                              │
                                   │                              │
                                   ▼                              ▼
                         ┌─────────────────────┐      ┌──────────────────────────┐
                         │ risk_treatment_actions│    │ control_testing_results  │
                         ├─────────────────────┤      ├──────────────────────────┤
                         │ id (PK)             │      │ id (PK)                  │
                         │ risk_id (FK)        │      │ control_id (FK)          │
                         │ title               │      │ test_date                │
                         │ action_type         │      │ result                   │
                         │ status              │      │ findings                 │
                         │ assigned_to (FK)    │      │ ...                      │
                         │ ...                 │      └──────────────────────────┘
                         └─────────────────────┘
                                   │
                                   │
                                   ▼
                         ┌─────────────────────┐
                         │   notifications     │
                         ├─────────────────────┤
                         │ id (PK)             │
                         │ user_id (FK)        │
                         │ title               │
                         │ message             │
                         │ is_read             │
                         │ ...                 │
                         └─────────────────────┘
```

## Table Details

### 1. Users Table (`users`)

**Purpose**: Stores user accounts and authentication information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'risk_manager', 'compliance_officer', 'auditor', 'viewer')),
  department VARCHAR(100),
  position VARCHAR(100),
  phone_number VARCHAR(20),
  avatar_url VARCHAR(500),
  
  -- Security fields
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  
  -- Password reset fields
  password_reset_token VARCHAR(255),
  password_reset_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Verification fields
  verification_token VARCHAR(255),
  verification_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

**Indexes**:
- `idx_users_email` - For login lookups
- `idx_users_role` - For role-based queries
- `idx_users_department` - For department filtering
- `idx_users_is_active` - For active user queries

### 2. Risks Table (`risks`)

**Purpose**: Risk register with assessment, treatment, and monitoring.

```sql
CREATE TABLE risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL CHECK (category IN (
    'strategic', 'operational', 'financial', 'compliance', 
    'reputational', 'technological', 'environmental', 'health_safety'
  )),
  
  -- Risk assessment
  likelihood VARCHAR(20) CHECK (likelihood IN ('rare', 'unlikely', 'possible', 'likely', 'almost_certain')),
  impact VARCHAR(20) CHECK (impact IN ('insignificant', 'minor', 'moderate', 'major', 'catastrophic')),
  risk_level VARCHAR(20) GENERATED ALWAYS AS (...) STORED,
  
  -- Risk treatment
  treatment_status VARCHAR(20) DEFAULT 'identified' CHECK (treatment_status IN (
    'identified', 'assessed', 'treated', 'monitored', 'closed'
  )),
  treatment_plan TEXT,
  treatment_deadline DATE,
  treatment_owner_id UUID REFERENCES users(id),
  
  -- Monitoring
  monitoring_frequency VARCHAR(50),
  next_review_date DATE,
  
  -- Ownership
  owner_id UUID REFERENCES users(id),
  department VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

**Generated Column**: `risk_level` is automatically calculated based on likelihood and impact using a risk matrix.

**Indexes**:
- `idx_risks_category` - For category filtering
- `idx_risks_risk_level` - For risk level queries
- `idx_risks_treatment_status` - For treatment status filtering
- `idx_risks_owner_id` - For owner-based queries
- `idx_risks_next_review_date` - For overdue reviews

### 3. Compliance Requirements Table (`compliance_requirements`)

**Purpose**: Tracks compliance requirements from regulations, standards, and policies.

```sql
CREATE TABLE compliance_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requirement_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  regulation_standard VARCHAR(100) NOT NULL,
  clause_reference VARCHAR(100),
  
  -- Compliance details
  requirement_type VARCHAR(50) CHECK (requirement_type IN (
    'legal', 'regulatory', 'contractual', 'policy', 'standard'
  )),
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'compliant', 'non_compliant', 'exempt'
  )),
  
  -- Deadlines
  effective_date DATE NOT NULL,
  deadline DATE,
  review_frequency VARCHAR(50),
  next_review_date DATE,
  
  -- Evidence
  evidence_required BOOLEAN DEFAULT true,
  evidence_description TEXT,
  evidence_storage_location VARCHAR(500),
  
  -- Ownership
  owner_id UUID REFERENCES users(id),
  department VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

**Indexes**:
- `idx_compliance_requirements_status` - For status filtering
- `idx_compliance_requirements_priority` - For priority-based queries
- `idx_compliance_requirements_deadline` - For deadline tracking
- `idx_compliance_requirements_owner_id` - For owner-based queries

### 4. Internal Controls Table (`internal_controls`)

**Purpose**: Manages internal controls for risk mitigation and compliance.

```sql
CREATE TABLE internal_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  control_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  control_type VARCHAR(50) CHECK (control_type IN (
    'preventive', 'detective', 'corrective', 'compensating', 'directive'
  )),
  control_category VARCHAR(50) CHECK (control_category IN (
    'financial', 'operational', 'compliance', 'it', 'security'
  )),
  
  -- Testing
  testing_frequency VARCHAR(50),
  last_test_date DATE,
  next_test_date DATE,
  test_result VARCHAR(20) CHECK (test_result IN (
    'effective', 'partially_effective', 'ineffective', 'not_tested'
  )),
  test_notes TEXT,
  tester_id UUID REFERENCES users(id),
  
  -- Design effectiveness
  design_effectiveness VARCHAR(20) CHECK (design_effectiveness IN (
    'effective', 'partially_effective', 'ineffective'
  )),
  design_notes TEXT,
  
  -- Operational effectiveness
  operational_effectiveness VARCHAR(20) CHECK (operational_effectiveness IN (
    'effective', 'partially_effective', 'ineffective'
  )),
  operational_notes TEXT,
  
  -- Risk linkage
  risk_id UUID REFERENCES risks(id),
  compliance_requirement_id UUID REFERENCES compliance_requirements(id),
  
  -- Ownership
  owner_id UUID REFERENCES users(id),
  department VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

**Indexes**:
- `idx_internal_controls_control_type` - For control type filtering
- `idx_internal_controls_test_result` - For test result queries
- `idx_internal_controls_risk_id` - For risk linkage
- `idx_internal_controls_compliance_requirement_id` - For compliance linkage

### 5. Audit Logs Table (`audit_logs`)

**Purpose**: Security audit trail for all system activities.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  event_action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100),
  
  -- User context
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  user_ip VARCHAR(45),
  user_agent TEXT,
  
  -- Event details
  old_values JSONB,
  new_values JSONB,
  changes JSONB,
  
  -- Metadata
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_audit_logs_event_type` - For event type filtering
- `idx_audit_logs_resource_type` - For resource type queries
- `idx_audit_logs_user_id` - For user activity tracking
- `idx_audit_logs_created_at` - For time-based queries

### 6. Other Tables

- **`compliance_evidence`**: Stores evidence supporting compliance requirements
- **`risk_treatment_actions`**: Tracks actions to treat identified risks
- **`control_testing_results`**: Records results of control testing activities
- **`notifications`**: Manages user notifications and reminders

## Row Level Security (RLS) Policies

### Overview
All tables have RLS enabled with policies based on user roles and departments.

### Key Policies

1. **Users Table**:
   - Users can read/update their own profile
   - Admins can manage all users
   - Role changes restricted to admins

2. **Risks Table**:
   - Department-based access for risk managers
   - Cross-department visibility for admins and auditors
   - Owners have full access to their risks

3. **Compliance Requirements**:
   - Department-based access for compliance officers
   - Read access for affected departments
   - Full access for admins and auditors

4. **Audit Logs**:
   - Users can see their own activity
   - Admins and auditors can see all activity
   - System inserts only (via triggers)

### RLS Implementation Example

```sql
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
```

## Triggers

### 1. Automatic Timestamps
All tables with `updated_at` columns have triggers to automatically update timestamps on modification.

```sql
CREATE TRIGGER update_updated_at_column 
BEFORE UPDATE ON table_name
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Audit Trail
Triggers on main tables (`users`, `risks`, `compliance_requirements`, `internal_controls`) automatically create audit log entries for all CRUD operations.

### 3. Risk Code Generation
Automatic generation of risk codes in format `RISK-YYYY-NNNN`.

## Views

### 1. Risk Dashboard (`risk_dashboard`)
Aggregated view for risk management dashboard with counts of related actions and controls.

### 2. Compliance Dashboard (`compliance_dashboard`)
Aggregated view for compliance management with evidence and control counts.

### 3. Overdue Items (`overdue_items`)
Unified view showing all overdue items across risks, compliance requirements, actions, and control tests.

## Performance Optimization

### 1. Indexing Strategy
- All foreign keys are indexed
- Frequently queried columns have indexes
- Composite indexes for common query patterns
- Partial indexes for active/inactive filtering

### 2. Query Optimization
- Use EXPLAIN ANALYZE for query tuning
- Monitor slow queries via `pg_stat_statements`
- Regular vacuum and analyze operations
- Connection pooling with pgBouncer

### 3. Partitioning Considerations
For high-volume tables (`audit_logs`), consider range partitioning by `created_at`:
```sql
-- Monthly partitions for audit logs
CREATE TABLE audit_logs_y2024m01 PARTITION OF audit_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## Maintenance Procedures

### 1. Daily Maintenance
```sql
-- Update statistics
ANALYZE;

-- Monitor table bloat
SELECT schemaname, tablename, 
       n_dead_tup, n_live_tup,
       round(n_dead_tup * 100 / (n_live_tup + n_dead_tup), 2) as dead_percent
FROM pg_stat_user_tables
WHERE n_live_tup > 0
ORDER BY dead_percent DESC;
```

### 2. Weekly Maintenance
```sql
-- Vacuum tables with high dead tuple percentage
VACUUM ANALYZE audit_logs;

-- Check index usage
SELECT schemaname, tablename, indexname,
       idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### 3. Monthly Maintenance
```sql
-- Reindex heavily updated tables
REINDEX TABLE audit_logs;

-- Check for unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;
```

## Security Considerations

### 1. Authentication
- Password hashing with bcrypt
- Account lockout after failed attempts
- Session management with Redis
- JWT tokens for API authentication

### 2. Authorization
- Role-based access control (RBAC)
- Department-based data segregation
- Row-level security policies
- Audit trail for all changes

### 3. Data Protection
- Encryption at rest (TDE considered for sensitive data)
- SSL/TLS for data in transit
- Regular security patches
- Compliance with