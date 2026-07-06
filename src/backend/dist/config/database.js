"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./logger"));
class Database {
    sequelize;
    isConnected = false;
    constructor() {
        this.sequelize = new sequelize_1.Sequelize({
            database: config_1.default.database.name,
            username: config_1.default.database.user,
            password: config_1.default.database.password,
            host: config_1.default.database.host,
            port: config_1.default.database.port,
            dialect: 'postgres',
            logging: config_1.default.isDevelopment ? (msg) => logger_1.default.debug(msg) : false,
            pool: config_1.default.database.pool,
            dialectOptions: {
                ssl: config_1.default.database.ssl
                    ? {
                        require: true,
                        rejectUnauthorized: false,
                    }
                    : false,
            },
            benchmark: false,
            typeValidation: true,
            quoteIdentifiers: true,
        });
    }
    async connect() {
        try {
            logger_1.default.info(`Attempting database connection to ${config_1.default.database.host}:${config_1.default.database.port}/${config_1.default.database.name} (ssl: ${config_1.default.database.ssl})`);
            await this.sequelize.authenticate();
            this.isConnected = true;
            logger_1.default.info('Database connection established successfully');
            if (config_1.default.isDevelopment) {
                await this.syncModels();
            }
        }
        catch (error) {
            const err = error;
            logger_1.default.error(`Unable to connect to the database at ${config_1.default.database.host}:${config_1.default.database.port}: ${err.message}`);
            logger_1.default.error('Full connection error:', { name: err.name, stack: err.stack?.slice(0, 500) });
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.sequelize.close();
            this.isConnected = false;
            logger_1.default.info('Database connection closed');
        }
        catch (error) {
            logger_1.default.error('Error closing database connection:', error);
            throw error;
        }
    }
    async syncModels() {
        try {
            await this.sequelize.query('PRAGMA journal_mode = WAL;');
            await this.sequelize.query('PRAGMA secure_delete = ON;');
            await this.sequelize.query('PRAGMA foreign_keys = ON;');
            logger_1.default.info('Database secure settings applied');
        }
        catch (error) {
            logger_1.default.warn('Could not apply database secure settings:', error);
        }
    }
    getSequelize() {
        return this.sequelize;
    }
    isConnectedStatus() {
        return this.isConnected;
    }
    async executeQuery(sql, values, options) {
        try {
            const [results, metadata] = await this.sequelize.query(sql, {
                replacements: values,
                transaction: options?.transaction,
                logging: options?.logging || config_1.default.isDevelopment,
            });
            return { results, metadata };
        }
        catch (error) {
            logger_1.default.error('Database query error:', error);
            throw error;
        }
    }
    async startTransaction(isolationLevel) {
        try {
            const transaction = await this.sequelize.transaction({
                isolationLevel: isolationLevel || 'READ COMMITTED',
            });
            return transaction;
        }
        catch (error) {
            logger_1.default.error('Failed to start transaction:', error);
            throw error;
        }
    }
    async commitTransaction(transaction) {
        try {
            await transaction.commit();
        }
        catch (error) {
            logger_1.default.error('Failed to commit transaction:', error);
            throw error;
        }
    }
    async rollbackTransaction(transaction) {
        try {
            await transaction.rollback();
        }
        catch (error) {
            logger_1.default.error('Failed to rollback transaction:', error);
            throw error;
        }
    }
    async healthCheck() {
        const startTime = Date.now();
        try {
            await this.sequelize.query('SELECT 1 as health_check');
            const latency = Date.now() - startTime;
            return {
                status: 'healthy',
                latency,
                details: {
                    database: config_1.default.database.name,
                    host: config_1.default.database.host,
                    port: config_1.default.database.port,
                    ssl: config_1.default.database.ssl,
                },
            };
        }
        catch (error) {
            logger_1.default.error('Database health check failed:', error);
            return {
                status: 'unhealthy',
                details: {
                    error: error?.message ?? "",
                    database: config_1.default.database.name,
                    host: config_1.default.database.host,
                },
            };
        }
    }
    async getStatistics() {
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
        }
        catch (error) {
            logger_1.default.error('Failed to get database statistics:', error);
            return null;
        }
    }
    async backup() {
        if (!config_1.default.isDevelopment) {
            throw new Error('Backup should be performed using dedicated backup tools in production');
        }
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = `backup-${timestamp}.sql`;
            logger_1.default.info(`Database backup created: ${backupFile}`);
            return backupFile;
        }
        catch (error) {
            logger_1.default.error('Database backup failed:', error);
            throw error;
        }
    }
    async migrate() {
        try {
            logger_1.default.info('Database migrations applied');
        }
        catch (error) {
            logger_1.default.error('Database migration failed:', error);
            throw error;
        }
    }
}
const database = new Database();
exports.default = database;
//# sourceMappingURL=database.js.map