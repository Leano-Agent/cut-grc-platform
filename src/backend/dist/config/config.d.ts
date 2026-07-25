declare const config: {
    env: any;
    port: any;
    apiVersion: any;
    isProduction: boolean;
    isDevelopment: boolean;
    isTest: boolean;
    database: {
        host: any;
        port: any;
        name: any;
        user: any;
        password: any;
        ssl: any;
        pool: {
            max: number;
            min: number;
            acquire: number;
            idle: number;
        };
    };
    redis: {
        host: any;
        port: any;
        password: any;
        keyPrefix: string;
    };
    jwt: {
        secret: any;
        expiresIn: any;
        refreshSecret: any;
        refreshExpiresIn: any;
    };
    corsOrigin: any;
    email: {
        host: any;
        port: any;
        user: any;
        password: any;
        from: any;
    };
    aws: {
        accessKeyId: any;
        secretAccessKey: any;
        region: any;
        s3Bucket: any;
    };
    logLevel: any;
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
        enabled: any;
        url: any;
        tlsEnabled: any;
        bindDN: any;
        bindCredentials: any;
        searchBase: any;
        searchFilter: any;
        usernameAttribute: any;
        emailAttribute: any;
        groupSearchFilter: any;
        roleMappings: any;
        syncDepartments: any;
        departmentAttribute: any;
        autoSyncEnabled: any;
        autoSyncSchedule: any;
        syncOnLogin: any;
        timeout: any;
        connectTimeout: any;
        idleTimeout: any;
        reconnect: any;
        strictDN: any;
        sizeLimit: any;
        timeLimit: any;
        fallbackToLocalAuth: any;
        allowMixedAuth: any;
        logAuthAttempts: any;
        logSyncOperations: any;
        logLevel: any;
        tlsOptions: {
            rejectUnauthorized: boolean;
        };
    };
};
export default config;
//# sourceMappingURL=config.d.ts.map