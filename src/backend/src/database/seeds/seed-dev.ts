          design_effectiveness: 'effective',
          operational_effectiveness: 'effective',
          risk_id: riskIds[2],
          compliance_requirement_id: requirementIds[1],
          department: 'IT',
          owner_id: adminId,
        },
        {
          title: 'Safety Inspection Program',
          description: 'Weekly safety inspections of campus facilities',
          control_type: 'preventive',
          control_category: 'security',
          testing_frequency: 'Weekly',
          last_test_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          test_result: 'effective',
          design_effectiveness: 'effective',
          operational_effectiveness: 'effective',
          risk_id: null,
          compliance_requirement_id: requirementIds[0],
          department: 'Security',
          owner_id: complianceOfficerId,
        },
      ];

      for (const control of controls) {
        await client.query(
          `INSERT INTO internal_controls (
            title, description, control_type, control_category,
            testing_frequency, last_test_date, test_result,
            design_effectiveness, operational_effectiveness,
            risk_id, compliance_requirement_id, department, owner_id,
            next_test_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            control.title,
            control.description,
            control.control_type,
            control.control_category,
            control.testing_frequency,
            control.last_test_date,
            control.test_result,
            control.design_effectiveness,
            control.operational_effectiveness,
            control.risk_id,
            control.compliance_requirement_id,
            control.department,
            control.owner_id,
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Test in 30 days
          ]
        );
      }

      await client.query('COMMIT');
      logger.info(`Seeded ${controls.length} internal controls`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to seed internal controls', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Seed additional data
   */
  private async seedAdditionalData(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get some IDs for relationships
      const [risksResult, controlsResult, usersResult] = await Promise.all([
        client.query('SELECT id FROM risks LIMIT 2'),
        client.query('SELECT id FROM internal_controls LIMIT 2'),
        client.query('SELECT id FROM users WHERE role = $1', ['auditor']),
      ]);
      
      const riskIds = risksResult.rows.map(r => r.id);
      const controlIds = controlsResult.rows.map(c => c.id);
      const auditorId = usersResult.rows[0]?.id;
      
      // Seed risk treatment actions
      const actions = [
        {
          risk_id: riskIds[0],
          title: 'Implement Multi-Factor Authentication',
          description: 'Deploy MFA for all administrative systems',
          action_type: 'reduce',
          status: 'in_progress',
          priority: 'high',
          start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
          assigned_to: auditorId,
        },
        {
          risk_id: riskIds[1],
          title: 'Conduct Privacy Impact Assessment',
          description: 'Assess privacy risks for all data processing activities',
          action_type: 'reduce',
          status: 'pending',
          priority: 'medium',
          start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          assigned_to: auditorId,
        },
      ];

      for (const action of actions) {
        await client.query(
          `INSERT INTO risk_treatment_actions (
            risk_id, title, description, action_type, status, priority,
            start_date, due_date, assigned_to
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            action.risk_id,
            action.title,
            action.description,
            action.action_type,
            action.status,
            action.priority,
            action.start_date,
            action.due_date,
            action.assigned_to,
          ]
        );
      }

      // Seed control testing results
      const testResults = [
        {
          control_id: controlIds[0],
          test_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          test_type: 'operational',
          tester_id: auditorId,
          test_method: 'Sample Testing',
          sample_size: 50,
          result: 'effective',
          findings: 'All sampled access rights were appropriate',
          recommendations: 'Continue quarterly reviews',
        },
        {
          control_id: controlIds[1],
          test_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          test_type: 'design',
          tester_id: auditorId,
          test_method: 'Walkthrough',
          sample_size: 10,
          result: 'partially_effective',
          findings: 'Two exceptions found where approvals were bypassed',
          recommendations: 'Enhance system controls to prevent bypass',
        },
      ];

      for (const test of testResults) {
        await client.query(
          `INSERT INTO control_testing_results (
            control_id, test_date, test_type, tester_id, test_method,
            sample_size, result, findings, recommendations
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            test.control_id,
            test.test_date,
            test.test_type,
            test.tester_id,
            test.test_method,
            test.sample_size,
            test.result,
            test.findings,
            test.recommendations,
          ]
        );
      }

      await client.query('COMMIT');
      logger.info('Seeded additional data (actions and test results)');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to seed additional data', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run all seed operations
   */
  async run(): Promise<void> {
    logger.info('Starting development seed...');
    
    try {
      await this.clearSeedData();
      await this.seedUsers();
      await this.seedRisks();
      await this.seedComplianceRequirements();
      await this.seedInternalControls();
      await this.seedAdditionalData();
      
      logger.info('Development seed completed successfully');
    } catch (error) {
      logger.error('Development seed failed', { error });
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Main execution
async function main() {
  const seeder = new DevSeeder();
  
  try {
    await seeder.run();
    logger.info('Seed data has been successfully loaded');
    console.log('\n✅ Development seed completed successfully!');
    console.log('\nDefault login credentials:');
    console.log('  Admin: admin@cut.ac.za / Admin123!');
    console.log('  Risk Manager: risk.manager@cut.ac.za / Risk123!');
    console.log('  Compliance Officer: compliance@cut.ac.za / Compliance123!');
    console.log('  Auditor: auditor@cut.ac.za / Audit123!');
    console.log('  Viewer: finance.viewer@cut.ac.za / Viewer123!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await seeder.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    logger.error('Seed script failed', { error });
    process.exit(1);
  });
}

export default DevSeeder;