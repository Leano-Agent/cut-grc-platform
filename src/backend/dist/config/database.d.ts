import { Sequelize } from 'sequelize';
declare class Database {
    private sequelize;
    private isConnected;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private syncModels;
    getSequelize(): Sequelize;
    isConnectedStatus(): boolean;
    executeQuery(sql: string, values?: any[], options?: {
        transaction?: any;
        logging?: boolean;
    }): Promise<any>;
    startTransaction(isolationLevel?: string): Promise<any>;
    commitTransaction(transaction: any): Promise<void>;
    rollbackTransaction(transaction: any): Promise<void>;
    healthCheck(): Promise<{
        status: string;
        latency?: number;
        details?: any;
    }>;
    getStatistics(): Promise<any>;
    backup(): Promise<string>;
    migrate(): Promise<void>;
}
declare const database: Database;
export default database;
//# sourceMappingURL=database.d.ts.map