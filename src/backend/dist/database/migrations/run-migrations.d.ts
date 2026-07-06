#!/usr/bin/env ts-node
declare class MigrationRunner {
    private pool;
    private migrationsDir;
    constructor();
    private initMigrationsTable;
    private getAppliedMigrations;
    private getMigrationFiles;
    private readMigrationFile;
    private executeMigration;
    up(): Promise<void>;
    down(): Promise<void>;
    reset(): Promise<void>;
    status(): Promise<void>;
    create(name: string): Promise<void>;
    close(): Promise<void>;
}
export default MigrationRunner;
//# sourceMappingURL=run-migrations.d.ts.map