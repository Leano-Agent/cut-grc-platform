/**
 * SQLite Database Configuration for Free Tier Deployment
 * Uses SQLite instead of PostgreSQL for zero-cost deployment
 */

import Database from './database';
// import sqlite3 from 'sqlite3'; // removed - not installed
import { open, Database as SQLiteDatabase } from 'sqlite';
import path from 'path';
import fs from 'fs';

export class SQLiteDatabaseService implements Database {
  private db: SQLiteDatabase | null = null;
  private dbPath: string;

  constructor() {
    // Store database in /data directory (persistent storage on Render)
    this.dbPath = process.env.SQLITE_PATH || '/data/cut-grc.sqlite';
    
    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  async connect(): Promise<void> {
    try {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });

      // Enable foreign keys
      await this.db.run('PRAGMA foreign_keys = ON');
      
      // Enable WAL mode for better concurrency
      await this.db.run('PRAGMA journal_mode = WAL');
      
      // Set busy timeout
      await this.db.run('PRAGMA busy_timeout = 5000');

      console.log(`SQLite database connected at ${this.dbPath}`);
      
      // Create tables if they don't exist
      await this.createTables();
      
    } catch (error) {
      console.error('SQLite connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      console.log('SQLite database disconnected');
    }
  }

  async isConnected(): Promise<boolean> {
    return this.db !== null;
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.all(sql, params);
  }

  async execute(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    const result = await this.db.run(sql, params);
    return {
      lastID: result.lastID || 0,
      changes: result.changes || 0
    };
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    await this.db.run('BEGIN TRANSACTION');
    try {
      const result = await callback();
      await this.db.run('COMMIT');
      return result;
    } catch (error) {
      await this.db.run('ROLLBACK');
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const result = await this.query('SELECT 1 as health_check');
      return {
        status: 'healthy',
        details: {
          provider: 'SQLite',
          path: this.dbPath,
          connection: this.db ? 'connected' : 'disconnected',
          testQuery: result[0]?.health_check === 1 ? 'success' : 'failed'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          provider: 'SQLite',
          error: error?.message ?? "",
          path: this.dbPath
        }
      };
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    // Users table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'risk_manager', 'compliance_officer', 'auditor', 'department_head', 'user')),
        department TEXT,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Risks table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS risks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')),
        likelihood TEXT CHECK(likelihood IN ('rare', 'unlikely', 'possible', 'likely', 'certain')),
        impact TEXT CHECK(impact IN ('insignificant', 'minor', 'moderate', 'major', 'catastrophic')),
        status TEXT CHECK(status IN ('identified', 'assessed', 'treated', 'monitored', 'closed')),
        owner_id INTEGER REFERENCES users(id),
        due_date TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_risks_category ON risks(category)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_risks_status ON risks(status)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_risks_owner ON risks(owner_id)');

    console.log('SQLite tables created/verified');
  }

  async seedInitialData(): Promise<void> {
    if (!this.db) return;

    // Check if we already have data
    const userCount = await this.query('SELECT COUNT(*) as count FROM users');
    if (userCount[0].count > 0) {
      console.log('Database already seeded, skipping');
      return;
    }

    // Create default admin user (password: Admin123!)
    const adminPasswordHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // bcrypt hash for "Admin123!"
    
    await this.execute(
      'INSERT INTO users (email, password_hash, full_name, role, department, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      ['admin@cut.ac.za', adminPasswordHash, 'System Administrator', 'admin', 'IT', true]
    );

    console.log('Default admin user created: admin@cut.ac.za / Admin123!');
  }
}

// Export singleton instance
export const sqliteDatabase = new SQLiteDatabaseService();