"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('3000'),
    API_VERSION: zod_1.z.string().default('v1'),
    DATABASE_URL: zod_1.z.string().optional(),
    DB_HOST: zod_1.z.string().default('localhost'),
    DB_PORT: zod_1.z.string().transform(Number).default('5432'),
    DB_NAME: zod_1.z.string().default('ngome'),
    DB_USER: zod_1.z.string().default('postgres'),
    DB_PASSWORD: zod_1.z.string().default('postgres'),
    DB_SSL: zod_1.z.string().transform(val => val === 'true').default('false'),
    REDIS_HOST: zod_1.z.string().default('localhost'),
    REDIS_PORT: zod_1.z.string().transform(Number).default('6379'),
    REDIS_PASSWORD: zod_1.z.string().optional(),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('24h'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:5173'),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().transform(Number).optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASSWORD: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().optional(),
    AD_ENABLED: zod_1.z.string().transform(val => val === 'true').default('false'),
    AD_URL: zod_1.z.string().default('ldap://localhost:389'),
    AD_TLS_ENABLED: zod_1.z.string().transform(val => val === 'true').default('false'),
    AD_BIND_DN: zod_1.z.string().default(''),
    AD_BIND_CREDENTIALS: zod_1.z.string().default(''),
    AD_SEARCH_BASE: zod_1.z.string().default('DC=domain,DC=com'),
    AD_SEARCH_FILTER: zod_1.z.string().default('(objectClass=user)'),
    AD_USERNAME_ATTRIBUTE: zod_1.z.string().default('sAMAccountName'),
    AD_EMAIL_ATTRIBUTE: zod_1.z.string().default('mail'),
    AD_GROUP_SEARCH_FILTER: zod_1.z.string().default('(objectClass=group)'),
    AD_ROLE_MAPPINGS: zod_1.z.string().default('{}'),
    AD_SYNC_DEPARTMENTS: zod_1.z.string().transform(val => val === 'true').default('true'),
    AD_DEPARTMENT_ATTRIBUTE: zod_1.z.string().default('department'),
    AD_AUTO_SYNC_ENABLED: zod_1.z.string().transform(val => val === 'true').default('true'),
    AD_AUTO_SYNC_SCHEDULE: zod_1.z.string().default('0 2 * * *'),
    AD_SYNC_ON_LOGIN: zod_1.z.string().transform(val => val === 'true').default('true'),
    AD_TIMEOUT: zod_1.z.string().transform(val => parseInt(val, 10)).default('5000'),
    AD_CONNECT_TIMEOUT: zod_1.z.string().transform(val => parseInt(val, 10)).default('5000'),
    AD_IDLE_TIMEOUT: zod_1.z.string().transform(val => parseInt(val, 10)).default('30000'),
    AD_RECONNECT: zod_1.z.string().transform(val => val === 'true').default('true'),
    AD_STRICT_DN: zod_1.z.string().transform(val => val === 'true').default('true'),
    AD_SIZE_LIMIT: zod_1.z.string().transform(val => parseInt(val, 10)).default('1000'),
    AD_TIME_LIMIT: zod_1.z.string().transform(val => parseInt(val, 10)).default('30'),
    AD_FALLBACK_TO_LOCAL_AUTH: zod_1.z.string().transform(val => val === 'true').default('true'),
    AD_ALLOW_MIXED_AUTH: zod_1.z.string().transform(val => val === 'true').default('false'),
    AD_LOG_AUTH_ATTEMPTS: zod_1.z.string().transform(val => val === 'true').default('true'),
    AD_LOG_SYNC_OPERATIONS: zod_1.z.string().transform(val => val === 'true').default('true'),
    AD_LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    AWS_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    AWS_REGION: zod_1.z.string().optional(),
    AWS_S3_BUCKET: zod_1.z.string().optional(),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});
const env = envSchema.parse(process.env);
const config = {
    env: env.NODE_ENV,
    port: env.PORT,
    apiVersion: env.API_VERSION,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
    database: (() => {
        const url = env.DATABASE_URL;
        if (url) {
            try {
                const parsed = new URL(url);
                const isInternal = parsed.hostname?.includes('railway.internal');
                const dbConfig = {
                    host: parsed.hostname,
                    port: parseInt(parsed.port || '5432'),
                    name: parsed.pathname.replace(/^\//, ''),
                    user: decodeURIComponent(parsed.username),
                    password: decodeURIComponent(parsed.password),
                    ssl: isInternal ? false : true,
                    pool: { max: 20, min: 5, acquire: 30000, idle: 10000 },
                };
                console.log('[DB Config] Parsed DATABASE_URL successfully:', {
                    host: dbConfig.host,
                    port: dbConfig.port,
                    name: dbConfig.name,
                    user: dbConfig.user,
                    ssl: dbConfig.ssl,
                });
                return dbConfig;
            }
            catch (parseErr) {
                console.error('[DB Config] Failed to parse DATABASE_URL — falling back to individual vars:', parseErr.message);
            }
        }
        else {
            console.warn('[DB Config] No DATABASE_URL found — using individual connection vars');
        }
        return {
            host: env.DB_HOST,
            port: env.DB_PORT,
            name: env.DB_NAME,
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            ssl: env.DB_SSL,
            pool: { max: 20, min: 5, acquire: 30000, idle: 10000 },
        };
    })(),
    redis: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
        keyPrefix: 'ngome:',
    },
    jwt: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
        refreshSecret: env.JWT_REFRESH_SECRET,
        refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    corsOrigin: env.CORS_ORIGIN,
    email: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        password: env.SMTP_PASSWORD,
        from: env.EMAIL_FROM || 'noreply@cut.ac.za',
    },
    aws: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        region: env.AWS_REGION || 'af-south-1',
        s3Bucket: env.AWS_S3_BUCKET,
    },
    logLevel: env.LOG_LEVEL,
    rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 100,
    },
    upload: {
        maxFileSize: 10 * 1024 * 1024,
        allowedFileTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
    },
    pagination: {
        defaultLimit: 20,
        maxLimit: 100,
    },
    socketIO: {
        pingInterval: 25000,
        pingTimeout: 60000,
    },
    ad: {
        enabled: env.AD_ENABLED,
        url: env.AD_URL,
        tlsEnabled: env.AD_TLS_ENABLED,
        bindDN: env.AD_BIND_DN,
        bindCredentials: env.AD_BIND_CREDENTIALS,
        searchBase: env.AD_SEARCH_BASE,
        searchFilter: env.AD_SEARCH_FILTER,
        usernameAttribute: env.AD_USERNAME_ATTRIBUTE,
        emailAttribute: env.AD_EMAIL_ATTRIBUTE,
        groupSearchFilter: env.AD_GROUP_SEARCH_FILTER,
        roleMappings: (() => {
            try {
                return JSON.parse(env.AD_ROLE_MAPPINGS);
            }
            catch {
                return {};
            }
        })(),
        syncDepartments: env.AD_SYNC_DEPARTMENTS,
        departmentAttribute: env.AD_DEPARTMENT_ATTRIBUTE,
        autoSyncEnabled: env.AD_AUTO_SYNC_ENABLED,
        autoSyncSchedule: env.AD_AUTO_SYNC_SCHEDULE,
        syncOnLogin: env.AD_SYNC_ON_LOGIN,
        timeout: env.AD_TIMEOUT,
        connectTimeout: env.AD_CONNECT_TIMEOUT,
        idleTimeout: env.AD_IDLE_TIMEOUT,
        reconnect: env.AD_RECONNECT,
        strictDN: env.AD_STRICT_DN,
        sizeLimit: env.AD_SIZE_LIMIT,
        timeLimit: env.AD_TIME_LIMIT,
        fallbackToLocalAuth: env.AD_FALLBACK_TO_LOCAL_AUTH,
        allowMixedAuth: env.AD_ALLOW_MIXED_AUTH,
        logAuthAttempts: env.AD_LOG_AUTH_ATTEMPTS,
        logSyncOperations: env.AD_LOG_SYNC_OPERATIONS,
        logLevel: env.AD_LOG_LEVEL,
        tlsOptions: env.AD_TLS_ENABLED ? { rejectUnauthorized: false } : undefined,
    },
};
exports.default = config;
//# sourceMappingURL=config.js.map