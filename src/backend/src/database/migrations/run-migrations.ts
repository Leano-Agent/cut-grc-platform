#!/usr/bin/env ts-node

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import config from '../../config/config';
import logger from '../../utils/logger';

/**
 * Migration runner for CUT GRC Platform
 * 
 * Usage:
 *   ts-node run-migrations.ts up    - Run all pending migrations
 *   ts-node run-migrations.ts down  - Rollback last migration
 *   ts-node run-migrations.ts reset - Rollback all migrations
 *   ts-node run-migrations.ts status - Show migration status
 */

interface Migration {
  id: number;
  name: string;
  applied_at: Date;
}

class MigrationRunner {
  private pool: Pool;
  private migrationsDir: string;

  constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    });

    this.migrationsDir = path.join(__dirname, '.');
  }

  /**
   * Initialize the migrations table
   */
  private async initMigrationsTable(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      logger.info('Migrations table initialized');
    } catch (error) {
      logger.error('Failed to initialize migrations table', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all applied migrations
   */
  private async getAppliedMigrations(): Promise<Migration[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query<Migration>(
        'SELECT id, name, applied_at FROM migrations ORDER BY id ASC'
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get applied migrations', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all migration files
   */
  private getMigrationFiles(): string[] {
    return fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql') && file !== 'run-migrations.ts')
      .sort();
  }

  /**
   * Read migration file content
   */
  private readMigrationFile(filename: string): string {
    const filePath = path.join(this.migrationsDir, filename);
    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Execute a migration
   */
  private async executeMigration(filename: string, direction: 'up' | 'down'): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const content = this.readMigrationFile(filename);
      
      // Split by semicolon and execute each statement
      const statements = content.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await client.query(statement);
        }
      }
      
      if (direction === 'up') {
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [filename]
        );
        logger.info(`Applied migration: ${filename}`);
      } else {
        await client.query(
          'DELETE FROM migrations WHERE name = $1',
          [filename]
        );
        logger.info(`Rolled back migration: ${filename}`);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Failed to execute migration: ${filename}`, { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run pending migrations
   */
  async up(): Promise<void> {
    try {
      await this.initMigrationsTable();
      const appliedMigrations = await this.getAppliedMigrations();
      const appliedNames = new Set(appliedMigrations.map(m => m.name));
      
      const migrationFiles = this.getMigrationFiles();
      const pendingMigrations = migrationFiles.filter(file => !appliedNames.has(file));
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return;
      }
      
      logger.info(`Found ${pendingMigrations.length} pending migration(s)`);
      
      for (const migration of pendingMigrations) {
        logger.info(`Applying migration: ${migration}`);
        await this.executeMigration(migration, 'up');
      }
      
      logger.info('All migrations applied successfully');
    } catch (error) {
      logger.error('Migration failed', { error });
      process.exit(1);
    }
  }

  /**
   * Rollback last migration
   */
  async down(): Promise<void> {
    try {
      await this.initMigrationsTable();
      const appliedMigrations = await this.getAppliedMigrations();
      
      if (appliedMigrations.length === 0) {
        logger.info('No migrations to rollback');
        return;
      }
      
      const lastMigration = appliedMigrations[appliedMigrations.length - 1];
      logger.info(`Rolling back migration: ${lastMigration.name}`);
      
      await this.executeMigration(lastMigration.name, 'down');
      logger.info('Migration rolled back successfully');
    } catch (error) {
      logger.error('Rollback failed', { error });
      process.exit(1);
    }
  }

  /**
   * Rollback all migrations
   */
  async reset(): Promise<void> {
    try {
      await this.initMigrationsTable();
      const appliedMigrations = await this.getAppliedMigrations();
      
      if (appliedMigrations.length === 0) {
        logger.info('No migrations to reset');
        return;
      }
      
      logger.info(`Rolling back ${appliedMigrations.length} migration(s)`);
      
      // Rollback in reverse order
      for (let i = appliedMigrations.length - 1; i >= 0; i--) {
        const migration = appliedMigrations[i];
        logger.info(`Rolling back migration: ${migration.name}`);
        await this.executeMigration(migration.name, 'down');
      }
      
      logger.info('All migrations rolled back successfully');
    } catch (error) {
      logger.error('Reset failed', { error });
      process.exit(1);
    }
  }

  /**
   * Show migration status
   */
  async status(): Promise<void> {
    try {
      await this.initMigrationsTable();
      const appliedMigrations = await this.getAppliedMigrations();
      const migrationFiles = this.getMigrationFiles();
      
      console.log('\n=== Migration Status ===\n');
      console.log('Applied migrations:');
      
      if (appliedMigrations.length === 0) {
        console.log('  (none)');
      } else {
        appliedMigrations.forEach(migration => {
          console.log(`  ✓ ${migration.name} (applied at: ${migration.applied_at.toISOString()})`);
        });
      }
      
      console.log('\nPending migrations:');
      const appliedNames = new Set(appliedMigrations.map(m => m.name));
      const pendingMigrations = migrationFiles.filter(file => !appliedNames.has(file));
      
      if (pendingMigrations.length === 0) {
        console.log('  (none)');
      } else {
        pendingMigrations.forEach(migration => {
          console.log(`  ○ ${migration}`);
        });
      }
      
      console.log(`\nTotal: ${appliedMigrations.length} applied, ${pendingMigrations.length} pending`);
    } catch (error) {
      logger.error('Failed to get migration status', { error });
      process.exit(1);
    }
  }

  /**
   * Create a new migration template
   */
  async create(name: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const filename = `${timestamp}-${name.replace(/[^a-zA-Z0-9]/g, '-')}.sql`;
      const filePath = path.join(this.migrationsDir, filename);
      
      const template = `-- Migration: ${name}
-- Created at: ${new Date().toISOString()}

-- UP migration
-- Add your SQL statements here

-- Example:
-- CREATE TABLE example (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(255) NOT NULL
-- );

-- DOWN migration (optional)
-- Add rollback SQL statements here

-- Example:
-- DROP TABLE IF EXISTS example;
`;
      
      fs.writeFileSync(filePath, template);
      logger.info(`Created migration template: ${filename}`);
    } catch (error) {
      logger.error('Failed to create migration template', { error });
      process.exit(1);
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
  const runner = new MigrationRunner();
  
  try {
    const command = process.argv[2];
    
    switch (command) {
      case 'up':
        await runner.up();
        break;
      case 'down':
        await runner.down();
        break;
      case 'reset':
        await runner.reset();
        break;
      case 'status':
        await runner.status();
        break;
      case 'create':
        const name = process.argv[3];
        if (!name) {
          console.error('Usage: ts-node run-migrations.ts create <migration-name>');
          process.exit(1);
        }
        await runner.create(name);
        break;
      default:
        console.log(`
CUT GRC Platform Migration Runner

Usage:
  ts-node run-migrations.ts up        - Run all pending migrations
  ts-node run-migrations.ts down      - Rollback last migration
  ts-node run-migrations.ts reset     - Rollback all migrations
  ts-node run-migrations.ts status    - Show migration status
  ts-node run-migrations.ts create <name> - Create new migration template

Examples:
  ts-node run-migrations.ts up
  ts-node run-migrations.ts create add-new-feature
        `);
        break;
    }
  } finally {
    await runner.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    logger.error('Migration runner failed', { error });
    process.exit(1);
  });
}

export default MigrationRunner;