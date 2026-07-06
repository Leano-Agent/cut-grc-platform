#!/usr/bin/env ts-node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../../config/config"));
const logger_1 = __importDefault(require("../../utils/logger"));
class MigrationRunner {
    pool;
    migrationsDir;
    constructor() {
        this.pool = new pg_1.Pool({
            host: config_1.default.database.host,
            port: config_1.default.database.port,
            database: config_1.default.database.name,
            user: config_1.default.database.user,
            password: config_1.default.database.password,
            ssl: config_1.default.database.ssl ? { rejectUnauthorized: false } : false,
        });
        this.migrationsDir = path_1.default.join(__dirname, '.');
    }
    async initMigrationsTable() {
        const client = await this.pool.connect();
        try {
            await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
            logger_1.default.info('Migrations table initialized');
        }
        catch (error) {
            logger_1.default.error('Failed to initialize migrations table', { error });
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getAppliedMigrations() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT id, name, applied_at FROM migrations ORDER BY id ASC');
            return result.rows;
        }
        catch (error) {
            logger_1.default.error('Failed to get applied migrations', { error });
            throw error;
        }
        finally {
            client.release();
        }
    }
    getMigrationFiles() {
        return fs_1.default.readdirSync(this.migrationsDir)
            .filter(file => file.endsWith('.sql') && file !== 'run-migrations.ts')
            .sort();
    }
    readMigrationFile(filename) {
        const filePath = path_1.default.join(this.migrationsDir, filename);
        return fs_1.default.readFileSync(filePath, 'utf-8');
    }
    async executeMigration(filename, direction) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const content = this.readMigrationFile(filename);
            const statements = content.split(';').filter(stmt => stmt.trim());
            for (const statement of statements) {
                if (statement.trim()) {
                    await client.query(statement);
                }
            }
            if (direction === 'up') {
                await client.query('INSERT INTO migrations (name) VALUES ($1)', [filename]);
                logger_1.default.info(`Applied migration: ${filename}`);
            }
            else {
                await client.query('DELETE FROM migrations WHERE name = $1', [filename]);
                logger_1.default.info(`Rolled back migration: ${filename}`);
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.default.error(`Failed to execute migration: ${filename}`, { error });
            throw error;
        }
        finally {
            client.release();
        }
    }
    async up() {
        try {
            await this.initMigrationsTable();
            const appliedMigrations = await this.getAppliedMigrations();
            const appliedNames = new Set(appliedMigrations.map(m => m.name));
            const migrationFiles = this.getMigrationFiles();
            const pendingMigrations = migrationFiles.filter(file => !appliedNames.has(file));
            if (pendingMigrations.length === 0) {
                logger_1.default.info('No pending migrations');
                return;
            }
            logger_1.default.info(`Found ${pendingMigrations.length} pending migration(s)`);
            for (const migration of pendingMigrations) {
                logger_1.default.info(`Applying migration: ${migration}`);
                await this.executeMigration(migration, 'up');
            }
            logger_1.default.info('All migrations applied successfully');
        }
        catch (error) {
            logger_1.default.error('Migration failed', { error });
            process.exit(1);
        }
    }
    async down() {
        try {
            await this.initMigrationsTable();
            const appliedMigrations = await this.getAppliedMigrations();
            if (appliedMigrations.length === 0) {
                logger_1.default.info('No migrations to rollback');
                return;
            }
            const lastMigration = appliedMigrations[appliedMigrations.length - 1];
            logger_1.default.info(`Rolling back migration: ${lastMigration.name}`);
            await this.executeMigration(lastMigration.name, 'down');
            logger_1.default.info('Migration rolled back successfully');
        }
        catch (error) {
            logger_1.default.error('Rollback failed', { error });
            process.exit(1);
        }
    }
    async reset() {
        try {
            await this.initMigrationsTable();
            const appliedMigrations = await this.getAppliedMigrations();
            if (appliedMigrations.length === 0) {
                logger_1.default.info('No migrations to reset');
                return;
            }
            logger_1.default.info(`Rolling back ${appliedMigrations.length} migration(s)`);
            for (let i = appliedMigrations.length - 1; i >= 0; i--) {
                const migration = appliedMigrations[i];
                logger_1.default.info(`Rolling back migration: ${migration.name}`);
                await this.executeMigration(migration.name, 'down');
            }
            logger_1.default.info('All migrations rolled back successfully');
        }
        catch (error) {
            logger_1.default.error('Reset failed', { error });
            process.exit(1);
        }
    }
    async status() {
        try {
            await this.initMigrationsTable();
            const appliedMigrations = await this.getAppliedMigrations();
            const migrationFiles = this.getMigrationFiles();
            console.log('\n=== Migration Status ===\n');
            console.log('Applied migrations:');
            if (appliedMigrations.length === 0) {
                console.log('  (none)');
            }
            else {
                appliedMigrations.forEach(migration => {
                    console.log(`  ✓ ${migration.name} (applied at: ${migration.applied_at.toISOString()})`);
                });
            }
            console.log('\nPending migrations:');
            const appliedNames = new Set(appliedMigrations.map(m => m.name));
            const pendingMigrations = migrationFiles.filter(file => !appliedNames.has(file));
            if (pendingMigrations.length === 0) {
                console.log('  (none)');
            }
            else {
                pendingMigrations.forEach(migration => {
                    console.log(`  ○ ${migration}`);
                });
            }
            console.log(`\nTotal: ${appliedMigrations.length} applied, ${pendingMigrations.length} pending`);
        }
        catch (error) {
            logger_1.default.error('Failed to get migration status', { error });
            process.exit(1);
        }
    }
    async create(name) {
        try {
            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
            const filename = `${timestamp}-${name.replace(/[^a-zA-Z0-9]/g, '-')}.sql`;
            const filePath = path_1.default.join(this.migrationsDir, filename);
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
            fs_1.default.writeFileSync(filePath, template);
            logger_1.default.info(`Created migration template: ${filename}`);
        }
        catch (error) {
            logger_1.default.error('Failed to create migration template', { error });
            process.exit(1);
        }
    }
    async close() {
        await this.pool.end();
    }
}
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
            case 'create': {
                const name = process.argv[3];
                if (!name) {
                    console.error('Usage: ts-node run-migrations.ts create <migration-name>');
                    process.exit(1);
                }
                await runner.create(name);
                break;
            }
            default:
                console.log(`
Ngome Platform Migration Runner

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
    }
    finally {
        await runner.close();
    }
}
if (require.main === module) {
    main().catch(error => {
        logger_1.default.error('Migration runner failed', { error });
        process.exit(1);
    });
}
exports.default = MigrationRunner;
//# sourceMappingURL=run-migrations.js.map