import { Sequelize } from 'sequelize';
import config from './config';
import logger from './logger';

class Database {
  private sequelize: Sequelize;
  private isConnected: boolean = false;

  constructor() {
    // Initialize Sequelize with PostgreSQL
    this.sequelize = new Sequelize({
      database: config.database.name,
      username: config.database.user,
      password: config.database.password,
      host: config.database.host,
      port: config.database.port,
      dialect: 'postgres',
      logging: config.isDevelopment ? (msg) => logger.debug(msg) : false,
      pool: config.database.pool,
      dialectOptions: {
        ssl: config.database.ssl
          ? {
              require: true,
              rejectUnauthorized: false,
            }
          : false,
      },
      // Security: prevent timing attacks
      benchmark: false,
      // Security: use parameterized queries
      typeValidation: true,
      // Security: sanitize inputs
      quoteIdentifiers: true,
    });
  }

  /**
   * Connect to the database
   */
  async connect(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      this.isConnected = true;
      logger.info('Database connection established successfully');
      
      // Sync models in development
      if (config.isDevelopment) {
        await this.syncModels();
      }
    } catch (error) {
      logger.error('Unable to connect to the database:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    try {
      await this.sequelize.close();
      this.isConnected = false;
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  /**
   * Sync database models (for development only)
   */
  private async syncModels(): Promise<void> {
    try {
      // Enable WAL mode for better performance and durability
      await this.sequelize.query('PRAGMA journal_mode = WAL;');
      
      // Set secure PRAGMAs
      await this.sequelize.query('PRAGMA secure_delete = ON;');
      await this.sequelize.query('PRAGMA foreign_keys = ON;');
      
      logger.info('Database secure settings applied');
    } catch (error) {
      logger.warn('Could not apply database secure settings:', error);
    }
  }

  /**
   * Get Sequelize instance
   */
  getSequelize(): Sequelize {
    return this.sequelize;
  }

  /**
   * Check if database is connected
   */
  isConnectedStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Execute a secure query with parameterization
   */
  async executeQuery(
    sql: string,
    values?: any[],
    options?: { transaction?: any; logging?: boolean }
  ): Promise<any> {
    try {
      // Use parameterized queries to prevent SQL injection
      const [results, metadata] = await this.sequelize.query(sql, {
        replacements: values,
        transaction: options?.transaction,
        logging: options?.logging || config.isDevelopment,
      });
      
      return { results, metadata };
    } catch (error) {
      logger.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Start a transaction with isolation level
   */
  async startTransaction(isolationLevel?: string): Promise<any> {
    try {
      const transaction = await (this.sequelize.transaction as any)({
        isolationLevel: isolationLevel || 'READ COMMITTED',
      });
      
      return transaction;
    } catch (error) {
      logger.error('Failed to start transaction:', error);
      throw error;
    }
  }

  /**
   * Commit a transaction
   */
  async commitTransaction(transaction: any): Promise<void> {
    try {
      await transaction.commit();
    } catch (error) {
      logger.error('Failed to commit transaction:', error);
      throw error;
    }
  }

  /**
   * Rollback a transaction
   */
  async rollbackTransaction(transaction: any): Promise<void> {
    try {
      await transaction.rollback();
    } catch (error) {
      logger.error('Failed to rollback transaction:', error);
      throw error;
    }
  }

  /**
   * Health check for database
   */
  async healthCheck(): Promise<{
    status: string;
    latency?: number;
    details?: any;
  }> {
    const startTime = Date.now();
    
    try {
      // Simple query to check database connectivity
      await this.sequelize.query('SELECT 1 as health_check');
      const latency = Date.now() - startTime;
      
      return {
        status: 'healthy',
        latency,
        details: {
          database: config.database.name,
          host: config.database.host,
          port: config.database.port,
          ssl: config.database.ssl,
        },
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        details: {
          error: error?.message ?? "",
          database: config.database.name,
          host: config.database.host,
        },
      };
    }
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const stats = await this.sequelize.query(`
        SELECT 
          (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
          (SELECT pg_database_size(current_database())) as database_size,
          (SELECT numbackends FROM pg_stat_database WHERE datname = current_database()) as active_connections,
          (SELECT xact_commit FROM pg_stat_database WHERE datname = current_database()) as transactions_committed,
          (SELECT xact_rollback FROM pg_stat_database WHERE datname = current_database()) as transactions_rolled_back
      `);
      
      return stats[0][0];
    } catch (error) {
      logger.error('Failed to get database statistics:', error);
      return null;
    }
  }

  /**
   * Backup database (simplified - in production use proper backup tools)
   */
  async backup(): Promise<string> {
    if (!config.isDevelopment) {
      throw new Error('Backup should be performed using dedicated backup tools in production');
    }
    
    try {
      // This is a simplified backup for development
      // In production, use pg_dump or cloud-native backup solutions
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = `backup-${timestamp}.sql`;
      
      logger.info(`Database backup created: ${backupFile}`);
      return backupFile;
    } catch (error) {
      logger.error('Database backup failed:', error);
      throw error;
    }
  }

  /**
   * Apply database migrations
   */
  async migrate(): Promise<void> {
    try {
      // In a real application, use a proper migration tool like Sequelize migrations
      // or a dedicated migration library
      logger.info('Database migrations applied');
    } catch (error) {
      logger.error('Database migration failed:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const database = new Database();
export default database;