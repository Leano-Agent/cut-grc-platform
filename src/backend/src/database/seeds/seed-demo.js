// Production seed runner — seeds demo organisation and data on Railway startup
// Must be JavaScript (compiled from TS is in dist/)
// This is referenced by the start command after migration
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function run() {
  if (!process.env.RUN_SEED) {
    console.log('[seed-demo] SKIPPED — set RUN_SEED=true to seed demo data');
    process.exit(0);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Seed organisation
    await client.query(
      `INSERT INTO organisations (id, name, slug, subscription_tier, max_users)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO NOTHING`,
      ['00000000-0000-0000-0000-000000000001', 'Central University of Technology', 'cut', 'enterprise', 1000]
    );
    console.log('[seed-demo] Organisation seeded');

    // 2. Seed users
    const users = [
      { email: 'grcadmin@tyriie.com', pw: 'Password123!', first: 'GRC', last: 'Admin', role: 'admin' },
      { email: 'risk.manager@cut.ac.za', pw: 'Risk123!', first: 'Risk', last: 'Manager', role: 'risk_manager' },
      { email: 'compliance@cut.ac.za', pw: 'Compliance123!', first: 'Compliance', last: 'Officer', role: 'compliance_officer' },
      { email: 'auditor@cut.ac.za', pw: 'Audit123!', first: 'Internal', last: 'Auditor', role: 'auditor' },
      { email: 'viewer@cut.ac.za', pw: 'Viewer123!', first: 'Finance', last: 'Viewer', role: 'staff' },
    ];

    for (const u of users) {
      const hash = await bcrypt.hash(u.pw, 12);
      const id = `user_seed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await client.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, organisation_id, is_active, email_verified, failed_login_attempts, refresh_token_version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, '00000000-0000-0000-0000-000000000001', true, true, 0, 1, NOW(), NOW())
         ON CONFLICT (email) DO NOTHING`,
        [id, u.email, hash, u.first, u.last, u.role]
      );
    }
    console.log('[seed-demo] 5 users seeded');

    // 3. Get user IDs for references
    const userRows = await client.query('SELECT id, role FROM users WHERE organisation_id = $1', ['00000000-0000-0000-0000-000000000001']);
    const usersMap = {};
    for (const r of userRows.rows) usersMap[r.role] = r.id;

    // 4. Seed risks
    const risks = [
      { title: 'Data Security Breach', desc: 'Potential unauthorized access to student and staff records', cat: 'information_security', sev: 'critical', like: 'likely', dept: 'IT' },
      { title: 'POPIA Compliance Gap', desc: 'Inadequate data protection measures for personal information', cat: 'compliance', sev: 'high', like: 'certain', dept: 'Legal' },
      { title: 'Budget Overrun', desc: 'Infrastructure project exceeding allocated budget', cat: 'financial', sev: 'medium', like: 'likely', dept: 'Finance' },
      { title: 'Academic Fraud Risk', desc: 'Risk of fraudulent qualifications or grade manipulation', cat: 'fraud', sev: 'high', like: 'possible', dept: 'Academic' },
      { title: 'Network Infrastructure Failure', desc: 'Critical campus network infrastructure at risk of outage', cat: 'operational', sev: 'high', like: 'possible', dept: 'IT' },
      { title: 'Reputational Damage', desc: 'Negative media coverage affecting university reputation', cat: 'reputational', sev: 'medium', like: 'unlikely', dept: 'Communications' },
      { title: 'Supplier Dependency', desc: 'Over-reliance on single critical software vendor', cat: 'strategic', sev: 'medium', like: 'possible', dept: 'Procurement' },
      { title: 'Research Grant Compliance', desc: 'Non-compliance with research grant funding conditions', cat: 'compliance', sev: 'high', like: 'possible', dept: 'Research' },
    ];

    const riskIds = [];
    for (const r of risks) {
      const id = `risk_seed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await client.query(
        `INSERT INTO risks (id, title, description, category, severity, likelihood, status, department, owner_id, created_by, organisation_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'identified', $7, $8, $8, '00000000-0000-0000-0000-000000000001', NOW(), NOW())`,
        [id, r.title, r.desc, r.cat, r.sev, r.like, r.dept, usersMap[r.dept === 'IT' ? 'admin' : 'risk_manager'] || usersMap['admin']]
      );
      riskIds.push(id);
    }
    console.log(`[seed-demo] ${risks.length} risks seeded`);

    // 5. Seed compliance requirements
    const reqs = [
      { title: 'POPIA Implementation', desc: 'Full compliance with Protection of Personal Information Act', src: 'POPIA', cat: 'data_privacy', status: 'partial', dept: 'Legal' },
      { title: 'PAIA Manual Update', desc: 'Annual update of Promotion of Access to Information Act manual', src: 'PAIA', cat: 'access_to_info', status: 'compliant', dept: 'Legal' },
      { title: 'ISO 27001 Certification', desc: 'Information security management system certification', src: 'ISO 27001', cat: 'information_security', status: 'under_review', dept: 'IT' },
      { title: 'HEQC Quality Assurance', desc: 'Higher Education Quality Committee compliance requirements', src: 'HEQC', cat: 'academic_quality', status: 'compliant', dept: 'Academic' },
      { title: 'GRAP Accounting Standards', desc: 'Generally Recognised Accounting Practice compliance', src: 'GRAP', cat: 'financial', status: 'not_assessed', dept: 'Finance' },
      { title: 'OHS Act Compliance', desc: 'Occupational Health and Safety Act workplace compliance', src: 'OHS Act', cat: 'health_safety', status: 'compliant', dept: 'Facilities' },
    ];

    const reqIds = [];
    for (const r of reqs) {
      const id = `req_seed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await client.query(
        `INSERT INTO compliance_requirements (id, title, description, regulation_source, category, status, department, owner_id, created_by, organisation_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, '00000000-0000-0000-0000-000000000001', NOW(), NOW())`,
        [id, r.title, r.desc, r.src, r.cat, r.status, r.dept, usersMap['compliance_officer'] || usersMap['admin']]
      );
      reqIds.push(id);
    }
    console.log(`[seed-demo] ${reqs.length} compliance requirements seeded`);

    // 6. Seed controls
    const controls = [
      { title: 'Access Control System', desc: 'Multi-factor authentication for all systems', type: 'preventive', freq: 'daily', eff: 'effective', dept: 'IT', risk: riskIds[0] },
      { title: 'Data Backup Procedure', desc: 'Automated daily backup of all critical systems', type: 'corrective', freq: 'daily', eff: 'effective', dept: 'IT', risk: riskIds[4] },
      { title: 'Budget Approval Workflow', desc: 'Multi-level approval for all expenditures above threshold', type: 'preventive', freq: 'weekly', eff: 'partially_effective', dept: 'Finance', risk: riskIds[2] },
      { title: 'Security Awareness Training', desc: 'Annual mandatory security training for all staff', type: 'directive', freq: 'annually', eff: 'effective', dept: 'HR', risk: riskIds[0] },
      { title: 'Vendor Due Diligence', desc: 'Security assessment for all third-party vendors', type: 'detective', freq: 'quarterly', eff: 'not_tested', dept: 'Procurement', risk: riskIds[6] },
    ];

    for (const c of controls) {
      const id = `ctrl_seed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await client.query(
        `INSERT INTO internal_controls (id, title, description, control_type, frequency, status, department, owner_id, risk_id, design_effectiveness, created_by, organisation_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8, $9, $7, '00000000-0000-0000-0000-000000000001', NOW(), NOW())`,
        [id, c.title, c.desc, c.type, c.freq, c.dept, usersMap['admin'], c.risk, c.eff]
      );
    }
    console.log(`[seed-demo] ${controls.length} controls seeded`);

    await client.query('COMMIT');
    console.log('[seed-demo] ✅ Demo data seeded successfully');
    console.log('\nDemo credentials:');
    console.log('  Admin:              grcadmin@tyriie.com / Password123!');
    console.log('  Risk Manager:       risk.manager@cut.ac.za / Risk123!');
    console.log('  Compliance Officer:  compliance@cut.ac.za / Compliance123!');
    console.log('  Auditor:            auditor@cut.ac.za / Audit123!');
    console.log('  Viewer:             viewer@cut.ac.za / Viewer123!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed-demo] ❌ Seed failed:', err.message);
    console.log('[seed-demo] Continuing despite seed error — DB may already have data');
  } finally {
    client.release();
    pool.end();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
