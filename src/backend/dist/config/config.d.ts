declare const config: {
    env: "development" | "production" | "test";
    port: number;
    apiVersion: string;
    isProduction: boolean;
    isDevelopment: boolean;
    isTest: boolean;
    database: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
        ssl: boolean;
        pool: {
            max: number;
            min: number;
            acquire: number;
            idle: number;
        };
    };
    redis: {
        host: string;
        port: number;
        password: string;
        keyPrefix: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
    corsOrigin: string;
    email: {
        host: string;
        port: number;
        user: string;
        password: string;
        from: string;
    };
    aws: {
        accessKeyId: string;
        secretAccessKey: string;
        region: string;
        s3Bucket: string;
    };
    logLevel: "error" | "warn" | "info" | "debug";
    rateLimit: {
        windowMs: number;
        max: number;
    };
    upload: {
        maxFileSize: number;
        allowedFileTypes: string[];
    };
    pagination: {
        defaultLimit: number;
        maxLimit: number;
    };
    socketIO: {
        pingInterval: number;
        pingTimeout: number;
    };
    ad: {
        enabled: boolean;
        url: string;
        tlsEnabled: boolean;
        bindDN: string;
        bindCredentials: string;
        searchBase: string;
        searchFilter: string;
        usernameAttribute: string;
        emailAttribute: string;
        groupSearchFilter: string;
        roleMappings: any;
        syncDepartments: boolean;
        departmentAttribute: string;
        autoSyncEnabled: boolean;
        autoSyncSchedule: string;
        syncOnLogin: boolean;
        timeout: number;
        connectTimeout: number;
        idleTimeout: number;
        reconnect: boolean;
        strictDN: boolean;
        sizeLimit: number;
        timeLimit: number;
        fallbackToLocalAuth: boolean;
        allowMixedAuth: boolean;
        logAuthAttempts: boolean;
        logSyncOperations: boolean;
        logLevel: "error" | "warn" | "info" | "debug";
        tlsOptions: {
            rejectUnauthorized: boolean;
        };
    };
};
export default config;
//# sourceMappingURL=config.d.ts.map