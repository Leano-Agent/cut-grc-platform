import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment variables schema
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_VERSION: z.string().default('v1'),
  
  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default('5432'),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_SSL: z.string().transform(val => val === 'true').default('false'),
  
  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  
  // Active Directory
  AD_ENABLED: z.string().transform(val => val === 'true').default('false'),
  AD_URL: z.string().default('ldap://localhost:389'),
  AD_TLS_ENABLED: z.string().transform(val => val === 'true').default('false'),
  AD_BIND_DN: z.string().default(''),
  AD_BIND_CREDENTIALS: z.string().default(''),
  AD_SEARCH_BASE: z.string().default('DC=domain,DC=com'),
  AD_SEARCH_FILTER: z.string().default('(objectClass=user)'),
  AD_USERNAME_ATTRIBUTE: z.string().default('sAMAccountName'),
  AD_EMAIL_ATTRIBUTE: z.string().default('mail'),
  AD_GROUP_SEARCH_FILTER: z.string().default('(objectClass=group)'),
  AD_ROLE_MAPPINGS: z.string().default('{}'),
  AD_SYNC_DEPARTMENTS: z.string().transform(val => val === 'true').default('true'),
  AD_DEPARTMENT_ATTRIBUTE: z.string().default('department'),
  AD_AUTO_SYNC_ENABLED: z.string().transform(val => val === 'true').default('true'),
  AD_AUTO_SYNC_SCHEDULE: z.string().default('0 2 * * *'),
  AD_SYNC_ON_LOGIN: z.string().transform(val => val === 'true').default('true'),
  AD_TIMEOUT: z.string().transform(val => parseInt(val, 10)).default('5000'),
  AD_CONNECT_TIMEOUT: z.string().transform(val => parseInt(val, 10)).default('5000'),
  AD_IDLE_TIMEOUT: z.string().transform(val => parseInt(val, 10)).default('30000'),
  AD_RECONNECT: z.string().transform(val => val === 'true').default('true'),
  AD_STRICT_DN: z.string().transform(val => val === 'true').default('true'),
  AD_SIZE_LIMIT: z.string().transform(val => parseInt(val, 10)).default('1000'),
  AD_TIME_LIMIT: z.string().transform(val => parseInt(val, 10)).default('30'),
  AD_FALLBACK_TO_LOCAL_AUTH: z.string().transform(val => val === 'true').default('true'),
  AD_ALLOW_MIXED_AUTH: z.string().transform(val => val === 'true').default('false'),
  AD_LOG_AUTH_ATTEMPTS: z.string().transform(val => val === 'true').default('true'),
  AD_LOG_SYNC_OPERATIONS: z.string().transform(val => val === 'true').default('true'),
  AD_LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // File upload
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Application configuration
const config = {
  // Application
  env: env.NODE_ENV,
  port: env.PORT,
  apiVersion: env.API_VERSION,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  
  // Database
  database: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
  },
  
  // Redis
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    keyPrefix: 'cut-grc:',
  },
  
  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  // CORS
  corsOrigin: env.CORS_ORIGIN,
  
  // Email
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.EMAIL_FROM || 'noreply@cut.ac.za',
  },
  
  // File upload
  aws: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION || 'af-south-1',
    s3Bucket: env.AWS_S3_BUCKET,
  },
  
  // Logging
  logLevel: env.LOG_LEVEL,
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  },
  
  // Upload limits
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
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
  
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  
  // Socket.IO
  socketIO: {
    pingInterval: 25000,
    pingTimeout: 60000,
  },
  
  // Active Directory
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
      } catch {
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

export default config;