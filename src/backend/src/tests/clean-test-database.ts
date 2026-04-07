import { Pool } from 'pg';
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

async function cleanTestDatabase() {
  const pool = new Pool(testDbConfig);
  
  try {
    console.log('Starting test database cleanup...');
    
    // Connect to database
    const client = await pool.connect();
    
    // Clean all test data
    console.log('Cleaning test data...');
    
    // Delete in correct order to respect foreign key constraints
    await client.query('DELETE FROM risk_assessments WHERE created_by LIKE $1', ['test-%']);
    await client.query('DELETE FROM risk_treatments WHERE created_by LIKE $1', ['test-%']);
    await client.query('DELETE FROM risks WHERE created_by LIKE $1', ['test-%']);
    await client.query('DELETE FROM compliance_records WHERE created_by LIKE $1', ['test-%']);
    await client.query('DELETE FROM compliance_requirements WHERE framework_id IN (SELECT id FROM compliance_frameworks WHERE name LIKE $1)', ['%Test%']);
    await client.query('DELETE FROM compliance_frameworks WHERE name LIKE $1', ['%Test%']);
    await client.query('DELETE FROM internal_control_tests WHERE created_by LIKE $1', ['test-%']);
    await client.query('DELETE FROM internal_controls WHERE created_by LIKE $1', ['test-%']);
    await client.query('DELETE FROM audit_findings WHERE created_by LIKE $1', ['test-%']);
    await client.query('DELETE FROM audit_engagements WHERE created_by LIKE $1', ['test-%']);
    
    // Clean risk categories (only if created by test)
    await client.query('DELETE FROM risk_categories WHERE created_by LIKE $1', ['test-%']);
    
    // Clean users (test users only)
    await client.query('DELETE FROM users WHERE email LIKE $1', ['%@test.example.com']);
    
    // Reset sequences if needed
    console.log('Resetting sequences...');
    const tables = [
      'users', 'risk_categories', 'risks', 'risk_assessments', 'risk_treatments',
      'compliance_frameworks', 'compliance_requirements', 'compliance_records',
      'internal_controls', 'internal_control_tests', 'audit_engagements', 'audit_findings'
    ];
    
    for (const table of tables) {
      try {
        await client.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`);
      } catch (error) {
        // Table might not exist or not have a serial sequence, ignore
        console.log(`Note: Could not reset sequence for ${table}`);
      }
    }
    
    console.log('Test database cleanup completed successfully!');
    
    client.release();
  } catch (error) {
    console.error('Error cleaning test database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanTestDatabase().catch(console.error);
}

export { cleanTestDatabase };