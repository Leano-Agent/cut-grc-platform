import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

function getPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    return new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'ngome',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
  });
}

async function seedDemo(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('🔵 Starting demo seed...');

    // ── 1. Seed Default Organisation ──────────────────────────────────
    console.log('🏛️  Seeding organisation...');

    await client.query(
      `INSERT INTO organisations (id, name, slug, subscription_tier, max_users)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO NOTHING`,
      ['00000000-0000-0000-0000-000000000001', 'Central University of Technology', 'cut', 'enterprise', 1000]
    );

    console.log('   ✅ Organisation seeded');

    // ── 2. Seed Demo Users ────────────────────────────────────────────
    console.log('👤 Seeding users...');

    const users = [
      {
        id: '00000000-0000-0000-0000-000000000010',
        email: 'grcadmin@tyriie.com',
        password: 'Password123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        orgRole: 'owner',
      },
      {
        id: '00000000-0000-0000-0000-000000000011',
        email: 'risk.manager@cut.ac.za',
        password: 'Risk123!',
        firstName: 'Risk',
        lastName: 'Manager',
        role: 'risk_manager',
        orgRole: 'admin',
      },
      {
        id: '00000000-0000-0000-0000-000000000012',
        email: 'compliance@cut.ac.za',
        password: 'Compliance123!',
        firstName: 'Compliance',
        lastName: 'Officer',
        role: 'compliance_officer',
        orgRole: 'admin',
      },
      {
        id: '00000000-0000-0000-0000-000000000013',
        email: 'auditor@cut.ac.za',
        password: 'Audit123!',
        firstName: 'Auditor',
        lastName: 'User',
        role: 'auditor',
        orgRole: 'member',
      },
      {
        id: '00000000-0000-0000-0000-000000000014',
        email: 'viewer@cut.ac.za',
        password: 'Viewer123!',
        firstName: 'Viewer',
        lastName: 'Staff',
        role: 'staff',
        orgRole: 'member',
      },
    ];

    const orgId = '00000000-0000-0000-0000-000000000001';

    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

      await client.query(
        `INSERT INTO users (
          id, email, password_hash, first_name, last_name,
          role, organisation_id, org_role, is_active, email_verified,
          failed_login_attempts, refresh_token_version, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING`,
        [
          user.id,
          user.email,
          passwordHash,
          user.firstName,
          user.lastName,
          user.role,
          orgId,
          user.orgRole,
          true,  // isActive
          true,  // emailVerified
          0,     // failedLoginAttempts
          1,     // refreshTokenVersion
        ]
      );
    }

    console.log(`   ✅ ${users.length} users seeded`);

    // ── 3. Seed Demo Risks ───────────────────────────────────────────
    console.log('⚠️  Seeding risks...');

    // Fetch user IDs (they may already exist from ON CONFLICT)
    const userRows = await client.query(
      'SELECT id, role FROM users WHERE organisation_id = $1',
      [orgId]
    );
    const userMap: Record<string, string> = {};
    for (const row of userRows.rows) {
      userMap[row.role] = row.id;
    }

    const riskOwnerId = userMap['risk_manager'] || userMap['admin'] || userRows.rows[0]?.id;

    const risks = [
      {
        id: '00000000-0000-0000-0000-000000000020',
        title: 'Data Breach via Phishing Attack',
        description: 'Risk of sensitive student and staff data being compromised through targeted phishing campaigns.',
        category: 'information_security',
        severity: 'high',
        likelihood: 'likely',
        status: 'open',
        risk_score: 20,
      },
      {
        id: '00000000-0000-0000-0000-000000000021',
        title: 'Non-Compliance with POPIA Regulations',
        description: 'Failure to comply with South African data protection regulations may result in fines and reputational damage.',
        category: 'compliance',
        severity: 'high',
        likelihood: 'possible',
        status: 'open',
        risk_score: 18,
      },
      {
        id: '00000000-0000-0000-0000-000000000022',
        title: 'Campus Network Outage',
        description: 'Extended network downtime affecting online learning platforms and administrative systems.',
        category: 'operational',
        severity: 'medium',
        likelihood: 'possible',
        status: 'mitigated',
        risk_score: 12,
      },
      {
        id: '00000000-0000-0000-0000-000000000023',
        title: 'Financial Fraud in Procurement',
        description: 'Risk of fraudulent procurement activities within the finance department.',
        category: 'fraud',
        severity: 'high',
        likelihood: 'unlikely',
        status: 'open',
        risk_score: 15,
      },
      {
        id: '00000000-0000-0000-0000-000000000024',
        title: 'Research Data Loss',
        description: 'Loss of critical research data due to inadequate backup and disaster recovery procedures.',
        category: 'operational',
        severity: 'critical',
        likelihood: 'possible',
        status: 'open',
        risk_score: 25,
      },
      {
        id: '00000000-0000-0000-0000-000000000025',
        title: 'Third-Party Vendor Security Gaps',
        description: 'Security vulnerabilities introduced through third-party software vendors and service providers.',
        category: 'information_security',
        severity: 'medium',
        likelihood: 'likely',
        status: 'closed',
        risk_score: 10,
      },
      {
        id: '00000000-0000-0000-0000-000000000026',
        title: 'Student Records Tampering',
        description: 'Unauthorized modification of academic records by internal or external actors.',
        category: 'fraud',
        severity: 'critical',
        likelihood: 'unlikely',
        status: 'open',
        risk_score: 22,
      },
      {
        id: '00000000-0000-0000-0000-000000000027',
        title: 'Inadequate Business Continuity Planning',
        description: 'The university lacks a comprehensive business continuity plan for major disruptions.',
        category: 'strategic',
        severity: 'medium',
        likelihood: 'possible',
        status: 'open',
        risk_score: 12,
      },
    ];

    for (const risk of risks) {
      await client.query(
        `INSERT INTO risks (
          id, title, description, category, severity, likelihood,
          status, risk_score, owner_id, organisation_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING`,
        [
          risk.id,
          risk.title,
          risk.description,
          risk.category,
          risk.severity,
          risk.likelihood,
          risk.status,
          risk.risk_score,
          riskOwnerId,
          orgId,
        ]
      );
    }

    console.log(`   ✅ ${risks.length} risks seeded`);

    // Fetch risk IDs for linking
    const riskRows = await client.query(
      'SELECT id FROM risks WHERE organisation_id = $1',
      [orgId]
    );
    const riskIds = riskRows.rows.map((r: any) => r.id);

    // ── 4. Seed Compliance Requirements ──────────────────────────────
    console.log('📋 Seeding compliance requirements...');

    const complianceOwnerId = userMap['compliance_officer'] || userMap['admin'] || userRows.rows[0]?.id;

    const requirements = [
      {
        id: '00000000-0000-0000-0000-000000000030',
        title: 'POPIA Data Protection Compliance',
        description: 'Ensure all personal data processing activities comply with the Protection of Personal Information Act.',
        regulation: 'POPIA',
        status: 'in_progress',
        risk_id: riskIds[0] || null,
        priority: 'high',
      },
      {
        id: '00000000-0000-0000-0000-000000000031',
        title: 'PAIA Manual Publication',
        description: 'Maintain and publish the Promotion of Access to Information Act manual as required by law.',
        regulation: 'PAIA',
        status: 'compliant',
        risk_id: null,
        priority: 'medium',
      },
      {
        id: '00000000-0000-0000-0000-000000000032',
        title: 'ICT Security Policy Compliance',
        description: 'Align university ICT security policies with NIST and ISO 27001 frameworks.',
        regulation: 'ISO 27001',
        status: 'in_progress',
        risk_id: riskIds[0] || null,
        priority: 'high',
      },
      {
        id: '00000000-0000-0000-0000-000000000033',
        title: 'Financial Reporting Standards (GRAP)',
        description: 'Comply with Generally Recognised Accounting Practice standards for public institutions.',
        regulation: 'GRAP',
        status: 'compliant',
        risk_id: riskIds[3] || null,
        priority: 'high',
      },
      {
        id: '00000000-0000-0000-0000-000000000034',
        title: 'Disaster Recovery Regulatory Requirements',
        description: 'Meet minimum regulatory requirements for data backup and disaster recovery.',
        regulation: 'POPIA',
        status: 'non_compliant',
        risk_id: riskIds[4] || null,
        priority: 'critical',
      },
      {
        id: '00000000-0000-0000-0000-000000000035',
        title: 'Student Data Handling Procedures',
        description: 'Implement and document procedures for handling student personal data in compliance with POPIA.',
        regulation: 'POPIA',
        status: 'not_started',
        risk_id: riskIds[6] || null,
        priority: 'medium',
      },
    ];

    for (const req of requirements) {
      await client.query(
        `INSERT INTO compliance_requirements (
          id, title, description, regulation, status,
          risk_id, owner_id, priority, organisation_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING`,
        [
          req.id,
          req.title,
          req.description,
          req.regulation,
          req.status,
          req.risk_id,
          complianceOwnerId,
          req.priority,
          orgId,
        ]
      );
    }

    console.log(`   ✅ ${requirements.length} compliance requirements seeded`);

    // Fetch requirement IDs
    const reqRows = await client.query(
      'SELECT id FROM compliance_requirements WHERE organisation_id = $1',
      [orgId]
    );
    const requirementIds = reqRows.rows.map((r: any) => r.id);

    // ── 5. Seed Internal Controls ─────────────────────────────────────
    console.log('🔒 Seeding internal controls...');

    const auditorId = userMap['auditor'] || userMap['admin'] || userRows.rows[0]?.id;

    const controls = [
      {
        title: 'Multi-Factor Authentication (MFA) Policy',
        description: 'MFA enforcement for all administrative system access.',
        control_type: 'preventive',
        control_category: 'technical',
        testing_frequency: 'Quarterly',
        test_result: 'effective',
        design_effectiveness: 'effective',
        operational_effectiveness: 'effective',
        risk_id: riskIds[0] || null,
        compliance_requirement_id: requirementIds[0] || null,
        department: 'IT',
        owner_id: auditorId,
      },
      {
        title: 'Data Privacy Impact Assessment Process',
        description: 'Mandatory DPIA for any new data processing activity involving personal data.',
        control_type: 'detective',
        control_category: 'process',
        testing_frequency: 'Monthly',
        test_result: 'partially_effective',
        design_effectiveness: 'effective',
        operational_effectiveness: 'partially_effective',
        risk_id: riskIds[1] || null,
        compliance_requirement_id: requirementIds[0] || null,
        department: 'Compliance',
        owner_id: complianceOwnerId,
      },
      {
        title: 'Network Monitoring & Intrusion Detection',
        description: 'Real-time monitoring of campus network traffic for suspicious activity.',
        control_type: 'detective',
        control_category: 'technical',
        testing_frequency: 'Daily',
        test_result: 'effective',
        design_effectiveness: 'effective',
        operational_effectiveness: 'effective',
        risk_id: riskIds[2] || null,
        compliance_requirement_id: requirementIds[2] || null,
        department: 'IT',
        owner_id: auditorId,
      },
      {
        title: 'Procurement Approval Workflow',
        description: 'Multi-level approval workflow for all procurement transactions above threshold.',
        control_type: 'preventive',
        control_category: 'process',
        testing_frequency: 'Quarterly',
        test_result: 'effective',
        design_effectiveness: 'effective',
        operational_effectiveness: 'effective',
        risk_id: riskIds[3] || null,
        compliance_requirement_id: requirementIds[3] || null,
        department: 'Finance',
        owner_id: auditorId,
      },
      {
        title: 'Automated Backup Verification',
        description: 'Daily automated verification of backup integrity with monthly restore tests.',
        control_type: 'corrective',
        control_category: 'technical',
        testing_frequency: 'Daily',
        test_result: 'ineffective',
        design_effectiveness: 'partially_effective',
        operational_effectiveness: 'ineffective',
        risk_id: riskIds[4] || null,
        compliance_requirement_id: requirementIds[4] || null,
        department: 'IT',
        owner_id: auditorId,
      },
    ];

    for (const control of controls) {
      await client.query(
        `INSERT INTO internal_controls (
          title, description, control_type, control_category,
          testing_frequency, test_result,
          design_effectiveness, operational_effectiveness,
          risk_id, compliance_requirement_id, department, owner_id,
          organisation_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        ON CONFLICT DO NOTHING`,
        [
          control.title,
          control.description,
          control.control_type,
          control.control_category,
          control.testing_frequency,
          control.test_result,
          control.design_effectiveness,
          control.operational_effectiveness,
          control.risk_id,
          control.compliance_requirement_id,
          control.department,
          control.owner_id,
          orgId,
        ]
      );
    }

    console.log(`   ✅ ${controls.length} internal controls seeded`);

    // ── Commit ────────────────────────────────────────────────────────
    await client.query('COMMIT');
    console.log('✅ Demo seed completed successfully!');
    console.log('\nDemo login credentials:');
    console.log('  Admin:              grcadmin@tyriie.com / Password123!');
    console.log('  Risk Manager:       risk.manager@cut.ac.za / Risk123!');
    console.log('  Compliance Officer: compliance@cut.ac.za / Compliance123!');
    console.log('  Auditor:            auditor@cut.ac.za / Audit123!');
    console.log('  Viewer:             viewer@cut.ac.za / Viewer123!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Demo seed failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
seedDemo().catch((error) => {
  console.error('❌ Demo seed failed:', error);
  process.exit(1);
});
