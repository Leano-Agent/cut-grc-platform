import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Test database configuration
const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'cut_grc_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
};

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');

async function seedTestDatabase() {
  const pool = new Pool(testDbConfig);
  
  try {
    console.log('Starting test database seeding...');
    
    // Connect to database
    const client = await pool.connect();
    
    // Clean existing test data
    console.log('Cleaning existing test data...');
    await client.query('DELETE FROM users WHERE email LIKE $1', ['%@test.example.com']);
    await client.query('DELETE FROM risks WHERE created_by LIKE $1', ['test-%']);
    await client.query('DELETE FROM compliance_records WHERE created_by LIKE $1', ['test-%']);
    await client.query('DELETE FROM internal_controls WHERE created_by LIKE $1', ['test-%']);
    
    // Hash passwords
    const hashedPassword = await bcrypt.hash('TestPassword123!', SALT_ROUNDS);
    
    // Insert test users
    console.log('Inserting test users...');
    const users = [
      {
        email: 'admin@test.example.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        permissions: JSON.stringify(['read:all', 'write:all', 'delete:all', 'manage:users']),
        is_active: true,
        email_verified: true
      },
      {
        email: 'risk.manager@test.example.com',
        password: hashedPassword,
        first_name: 'Risk',
        last_name: 'Manager',
        role: 'risk_manager',
        permissions: JSON.stringify(['read:risks', 'write:risks', 'manage:risks']),
        is_active: true,
        email_verified: true
      },
      {
        email: 'compliance.officer@test.example.com',
        password: hashedPassword,
        first_name: 'Compliance',
        last_name: 'Officer',
        role: 'compliance_officer',
        permissions: JSON.stringify(['read:compliance', 'write:compliance', 'manage:compliance']),
        is_active: true,
        email_verified: true
      },
      {
        email: 'auditor@test.example.com',
        password: hashedPassword,
        first_name: 'Internal',
        last_name: 'Auditor',
        role: 'auditor',
        permissions: JSON.stringify(['read:all', 'write:audits', 'manage:audits']),
        is_active: true,
        email_verified: true
      },
      {
        email: 'department.head@test.example.com',
        password: hashedPassword,
        first_name: 'Department',
        last_name: 'Head',
        role: 'department_head',
        permissions: JSON.stringify(['read:department', 'write:department']),
        is_active: true,
        email_verified: true
      },
      {
        email: 'regular.user@test.example.com',
        password: hashedPassword,
        first_name: 'Regular',
        last_name: 'User',
        role: 'user',
        permissions: JSON.stringify(['read:basic']),
        is_active: true,
        email_verified: true
      }
    ];
    
    for (const user of users) {
      await client.query(
        `INSERT INTO users (email, password, first_name, last_name, role, permissions, is_active, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET
           password = EXCLUDED.password,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           role = EXCLUDED.role,
           permissions = EXCLUDED.permissions,
           is_active = EXCLUDED.is_active,
           email_verified = EXCLUDED.email_verified,
           updated_at = NOW()`,
        [user.email, user.password, user.first_name, user.last_name, user.role, 
         user.permissions, user.is_active, user.email_verified]
      );
    }
    
    // Get user IDs for reference
    const userResults = await client.query(
      'SELECT id, email, role FROM users WHERE email LIKE $1 ORDER BY role',
      ['%@test.example.com']
    );
    
    const usersById: Record<string, any> = {};
    userResults.rows.forEach(user => {
      usersById[user.role] = user;
    });
    
    // Insert test risk categories
    console.log('Inserting test risk categories...');
    const riskCategories = [
      { name: 'Strategic Risk', description: 'Risks affecting achievement of strategic objectives', color: '#FF6B6B' },
      { name: 'Operational Risk', description: 'Risks in day-to-day operations', color: '#4ECDC4' },
      { name: 'Financial Risk', description: 'Risks related to financial management', color: '#45B7D1' },
      { name: 'Compliance Risk', description: 'Risks of non-compliance with laws and regulations', color: '#96CEB4' },
      { name: 'Reputational Risk', description: 'Risks to reputation and brand', color: '#FFEAA7' },
      { name: 'Cybersecurity Risk', description: 'Risks related to information security', color: '#DDA0DD' },
      { name: 'Health & Safety Risk', description: 'Risks to health and safety of people', color: '#98D8C8' },
      { name: 'Environmental Risk', description: 'Risks related to environmental impact', color: '#F7DC6F' }
    ];
    
    for (const category of riskCategories) {
      await client.query(
        `INSERT INTO risk_categories (name, description, color, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (name) DO UPDATE SET
           description = EXCLUDED.description,
           color = EXCLUDED.color,
           updated_at = NOW()`,
        [category.name, category.description, category.color]
      );
    }
    
    // Get risk category IDs
    const categoryResults = await client.query('SELECT id, name FROM risk_categories');
    const categoriesByName: Record<string, any> = {};
    categoryResults.rows.forEach(category => {
      categoriesByName[category.name] = category;
    });
    
    // Insert test risks
    console.log('Inserting test risks...');
    const risks = [
      {
        title: 'Data Breach Vulnerability',
        description: 'Potential exposure of sensitive student and staff data due to outdated security systems',
        category_id: categoriesByName['Cybersecurity Risk'].id,
        likelihood: 'HIGH',
        impact: 'HIGH',
        status: 'OPEN',
        owner_id: usersById['risk_manager'].id,
        created_by: 'test-seed',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        title: 'Budget Overrun',
        description: 'Risk of exceeding allocated budget for infrastructure projects',
        category_id: categoriesByName['Financial Risk'].id,
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        status: 'IN_PROGRESS',
        owner_id: usersById['department_head'].id,
        created_by: 'test-seed',
        due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
      },
      {
        title: 'Regulatory Non-compliance',
        description: 'Potential failure to meet new education department regulations',
        category_id: categoriesByName['Compliance Risk'].id,
        likelihood: 'LOW',
        impact: 'HIGH',
        status: 'OPEN',
        owner_id: usersById['compliance_officer'].id,
        created_by: 'test-seed',
        due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      },
      {
        title: 'Campus Safety Incident',
        description: 'Risk of safety incidents in laboratory facilities',
        category_id: categoriesByName['Health & Safety Risk'].id,
        likelihood: 'MEDIUM',
        impact: 'MEDIUM',
        status: 'MITIGATED',
        owner_id: usersById['department_head'].id,
        created_by: 'test-seed',
        due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days from now
      },
      {
        title: 'Reputation Damage from Research Ethics',
        description: 'Potential reputation damage from research ethics violations',
        category_id: categoriesByName['Reputational Risk'].id,
        likelihood: 'LOW',
        impact: 'HIGH',
        status: 'CLOSED',
        owner_id: usersById['admin'].id,
        created_by: 'test-seed',
        due_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000) // 120 days from now
      }
    ];
    
    for (const risk of risks) {
      await client.query(
        `INSERT INTO risks (title, description, category_id, likelihood, impact, status, owner_id, created_by, due_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [risk.title, risk.description, risk.category_id, risk.likelihood, risk.impact,
         risk.status, risk.owner_id, risk.created_by, risk.due_date]
      );
    }
    
    // Insert test compliance frameworks
    console.log('Inserting test compliance frameworks...');
    const frameworks = [
      { name: 'POPIA', description: 'Protection of Personal Information Act', country: 'South Africa', version: '2020' },
      { name: 'FICA', description: 'Financial Intelligence Centre Act', country: 'South Africa', version: '2001' },
      { name: 'GDPR', description: 'General Data Protection Regulation', country: 'EU', version: '2018' },
      { name: 'HEMIS', description: 'Higher Education Management Information System', country: 'South Africa', version: '2023' },
      { name: 'ISO 27001', description: 'Information Security Management', country: 'International', version: '2022' },
      { name: 'King IV', description: 'Corporate Governance Code', country: 'South Africa', version: '2016' }
    ];
    
    for (const framework of frameworks) {
      await client.query(
        `INSERT INTO compliance_frameworks (name, description, country, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (name, version) DO UPDATE SET
           description = EXCLUDED.description,
           country = EXCLUDED.country,
           updated_at = NOW()`,
        [framework.name, framework.description, framework.country, framework.version]
      );
    }
    
    // Get framework IDs
    const frameworkResults = await client.query('SELECT id, name FROM compliance_frameworks');
    const frameworksByName: Record<string, any> = {};
    frameworkResults.rows.forEach(framework => {
      frameworksByName[framework.name] = framework;
    });
    
    // Insert test compliance requirements
    console.log('Inserting test compliance requirements...');
    const requirements = [
      {
        framework_id: frameworksByName['POPIA'].id,
        code: 'POPIA-001',
        title: 'Personal Information Processing',
        description: 'Establish lawful basis for processing personal information',
        frequency: 'ANNUAL',
        owner_id: usersById['compliance_officer'].id
      },
      {
        framework_id: frameworksByName['FICA'].id,
        code: 'FICA-001',
        title: 'Customer Due Diligence',
        description: 'Verify identity of clients and beneficial owners',
        frequency: 'CONTINUOUS',
        owner_id: usersById['compliance_officer'].id
      },
      {
        framework_id: frameworksByName['GDPR'].id,
        code: 'GDPR-001',
        title: 'Data Protection Impact Assessment',
        description: 'Conduct DPIA for high-risk processing activities',
        frequency: 'AS_NEEDED',
        owner_id: usersById['compliance_officer'].id
      },
      {
        framework_id: frameworksByName['HEMIS'].id,
        code: 'HEMIS-001',
        title: 'Student Data Submission',
        description: 'Submit accurate student data to Department of Higher Education',
        frequency: 'QUARTERLY',
        owner_id: usersById['admin'].id
      },
      {
        framework_id: frameworksByName['ISO 27001'].id,
        code: 'ISO-001',
        title: 'Information Security Policy',
        description: 'Establish and maintain information security policy',
        frequency: 'ANNUAL',
        owner_id: usersById['risk_manager'].id
      }
    ];
    
    for (const requirement of requirements) {
      await client.query(
        `INSERT INTO compliance_requirements (framework_id, code, title, description, frequency, owner_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [requirement.framework_id, requirement.code, requirement.title, 
         requirement.description, requirement.frequency, requirement.owner_id]
      );
    }
    
    // Insert test internal controls
    console.log('Inserting test internal controls...');
    const controls = [
      {
        name: 'User Access Review',
        description: 'Quarterly review of user access rights',
        control_type: 'PREVENTIVE',
        frequency: 'QUARTERLY',
        owner_id: usersById['admin'].id,
        status: 'ACTIVE'
      },
      {
        name: 'Financial Reconciliation',
        description: 'Monthly reconciliation of bank accounts',
        control_type: 'DETECTIVE',
        frequency: 'MONTHLY',
        owner_id: usersById['department_head'].id,
        status: 'ACTIVE'
      },
      {
        name: 'Backup Verification',
        description: 'Weekly verification of data backups',
        control_type: 'CORRECTIVE',
        frequency: 'WEEKLY',
        owner_id: usersById['risk_manager'].id,
        status: 'ACTIVE'
      },
      {
        name: 'Vendor Due Diligence',
        description: 'Due diligence for new vendors',
        control_type: 'PREVENTIVE',
        frequency: 'AS_NEEDED',
        owner_id: usersById['compliance_officer'].id,
        status: 'ACTIVE'
      },
      {
        name: 'Incident Response Testing',
        description: 'Annual testing of incident response plan',
        control_type: 'DETECTIVE',
        frequency: 'ANNUAL',
        owner_id: usersById['risk_manager'].id,
        status: 'INACTIVE'
      }
    ];
    
    for (const control of controls) {
      await client.query(
        `INSERT INTO internal_controls (name, description, control_type, frequency, owner_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [control.name, control.description, control.control_type, 
         control.frequency, control.owner_id, control.status]
      );
    }
    
    console.log('Test database seeding completed successfully!');
    console.log(`Created ${users.length} test users`);
    console.log(`Created ${riskCategories.length} risk categories`);
    console.log(`Created ${risks.length} test risks`);
    console.log(`Created ${frameworks.length} compliance frameworks`);
    console.log(`Created ${requirements.length} compliance requirements`);
    console.log(`Created ${controls.length} internal controls`);
    
    // Display test user credentials
    console.log('\n=== Test User Credentials ===');
    console.log('All test users use password: TestPassword123!');
    users.forEach(user => {
      console.log(`Email: ${user.email} | Role: ${user.role}`);
    });
    
    client.release();
  } catch (error) {
    console.error('Error seeding test database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedTestDatabase().catch(console.error);
}

export { seedTestDatabase };