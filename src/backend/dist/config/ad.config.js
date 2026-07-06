"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADEnvSchema = exports.defaultADConfig = exports.ADConfigSchema = void 0;
exports.loadADConfigFromEnv = loadADConfigFromEnv;
exports.validateADConfig = validateADConfig;
exports.getSafeADConfig = getSafeADConfig;
exports.saveADConfigToFile = saveADConfigToFile;
exports.loadADConfigFromFile = loadADConfigFromFile;
exports.generateADEnvFile = generateADEnvFile;
const zod_1 = require("zod");
exports.ADConfigSchema = zod_1.z.object({
    enabled: zod_1.z.boolean().default(false),
    url: zod_1.z.string().url().default('ldap://localhost:389'),
    tlsEnabled: zod_1.z.boolean().default(false),
    tlsOptions: zod_1.z.record(zod_1.z.any()).default({ rejectUnauthorized: false }),
    bindDN: zod_1.z.string().default(''),
    bindCredentials: zod_1.z.string().default(''),
    searchBase: zod_1.z.string().default('DC=domain,DC=com'),
    searchFilter: zod_1.z.string().default('(objectClass=user)'),
    usernameAttribute: zod_1.z.string().default('sAMAccountName'),
    emailAttribute: zod_1.z.string().default('mail'),
    groupSearchFilter: zod_1.z.string().default('(objectClass=group)'),
    roleMappings: zod_1.z.record(zod_1.z.string()).default({
        'GRC_Admins': 'admin',
        'GRC_Managers': 'manager',
        'GRC_Auditors': 'auditor',
        'Domain Admins': 'admin',
        'Enterprise Admins': 'admin',
    }),
    syncDepartments: zod_1.z.boolean().default(true),
    departmentAttribute: zod_1.z.string().default('department'),
    autoSyncEnabled: zod_1.z.boolean().default(true),
    autoSyncSchedule: zod_1.z.string().default('0 2 * * *'),
    syncOnLogin: zod_1.z.boolean().default(true),
    timeout: zod_1.z.number().min(1000).max(30000).default(5000),
    connectTimeout: zod_1.z.number().min(1000).max(30000).default(5000),
    idleTimeout: zod_1.z.number().min(5000).max(60000).default(30000),
    reconnect: zod_1.z.boolean().default(true),
    strictDN: zod_1.z.boolean().default(true),
    sizeLimit: zod_1.z.number().min(1).max(10000).default(1000),
    timeLimit: zod_1.z.number().min(1).max(300).default(30),
    fallbackToLocalAuth: zod_1.z.boolean().default(true),
    allowMixedAuth: zod_1.z.boolean().default(false),
    logAuthAttempts: zod_1.z.boolean().default(true),
    logSyncOperations: zod_1.z.boolean().default(true),
    logLevel: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});
exports.defaultADConfig = {
    enabled: false,
    url: 'ldap://localhost:389',
    tlsEnabled: false,
    tlsOptions: { rejectUnauthorized: false },
    bindDN: '',
    bindCredentials: '',
    searchBase: 'DC=domain,DC=com',
    searchFilter: '(objectClass=user)',
    usernameAttribute: 'sAMAccountName',
    emailAttribute: 'mail',
    groupSearchFilter: '(objectClass=group)',
    roleMappings: {
        'GRC_Admins': 'admin',
        'GRC_Managers': 'manager',
        'GRC_Auditors': 'auditor',
        'Domain Admins': 'admin',
        'Enterprise Admins': 'admin',
    },
    syncDepartments: true,
    departmentAttribute: 'department',
    autoSyncEnabled: true,
    autoSyncSchedule: '0 2 * * *',
    syncOnLogin: true,
    timeout: 5000,
    connectTimeout: 5000,
    idleTimeout: 30000,
    reconnect: true,
    strictDN: true,
    sizeLimit: 1000,
    timeLimit: 30,
    fallbackToLocalAuth: true,
    allowMixedAuth: false,
    logAuthAttempts: true,
    logSyncOperations: true,
    logLevel: 'info',
};
exports.ADEnvSchema = zod_1.z.object({
    AD_ENABLED: zod_1.z.string().transform(val => val === 'true'),
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
});
function loadADConfigFromEnv(env) {
    try {
        const envConfig = exports.ADEnvSchema.parse(env);
        let roleMappings = exports.defaultADConfig.roleMappings;
        try {
            if (envConfig.AD_ROLE_MAPPINGS && envConfig.AD_ROLE_MAPPINGS !== '{}') {
                roleMappings = JSON.parse(envConfig.AD_ROLE_MAPPINGS);
            }
        }
        catch (error) {
            console.warn('Failed to parse AD_ROLE_MAPPINGS, using defaults');
        }
        let tlsOptions = exports.defaultADConfig.tlsOptions;
        if (envConfig.AD_TLS_ENABLED) {
            tlsOptions = { rejectUnauthorized: false };
        }
        return {
            enabled: envConfig.AD_ENABLED,
            url: envConfig.AD_URL,
            tlsEnabled: envConfig.AD_TLS_ENABLED,
            tlsOptions,
            bindDN: envConfig.AD_BIND_DN,
            bindCredentials: envConfig.AD_BIND_CREDENTIALS,
            searchBase: envConfig.AD_SEARCH_BASE,
            searchFilter: envConfig.AD_SEARCH_FILTER,
            usernameAttribute: envConfig.AD_USERNAME_ATTRIBUTE,
            emailAttribute: envConfig.AD_EMAIL_ATTRIBUTE,
            groupSearchFilter: envConfig.AD_GROUP_SEARCH_FILTER,
            roleMappings,
            syncDepartments: envConfig.AD_SYNC_DEPARTMENTS,
            departmentAttribute: envConfig.AD_DEPARTMENT_ATTRIBUTE,
            autoSyncEnabled: envConfig.AD_AUTO_SYNC_ENABLED,
            autoSyncSchedule: envConfig.AD_AUTO_SYNC_SCHEDULE,
            syncOnLogin: envConfig.AD_SYNC_ON_LOGIN,
            timeout: envConfig.AD_TIMEOUT,
            connectTimeout: envConfig.AD_CONNECT_TIMEOUT,
            idleTimeout: envConfig.AD_IDLE_TIMEOUT,
            reconnect: envConfig.AD_RECONNECT,
            strictDN: envConfig.AD_STRICT_DN,
            sizeLimit: envConfig.AD_SIZE_LIMIT,
            timeLimit: envConfig.AD_TIME_LIMIT,
            fallbackToLocalAuth: envConfig.AD_FALLBACK_TO_LOCAL_AUTH,
            allowMixedAuth: envConfig.AD_ALLOW_MIXED_AUTH,
            logAuthAttempts: envConfig.AD_LOG_AUTH_ATTEMPTS,
            logSyncOperations: envConfig.AD_LOG_SYNC_OPERATIONS,
            logLevel: envConfig.AD_LOG_LEVEL,
        };
    }
    catch (error) {
        console.error('Failed to load AD configuration from environment:', error);
        return exports.defaultADConfig;
    }
}
function validateADConfig(config) {
    const errors = [];
    const warnings = [];
    try {
        if (config.enabled) {
            if (!config.url) {
                errors.push('AD URL is required when AD is enabled');
            }
            if (!config.bindDN) {
                errors.push('Bind DN is required when AD is enabled');
            }
            if (!config.bindCredentials) {
                errors.push('Bind credentials are required when AD is enabled');
            }
            if (!config.searchBase) {
                errors.push('Search base is required when AD is enabled');
            }
            if (config.url && !config.url.startsWith('ldap://') && !config.url.startsWith('ldaps://')) {
                errors.push('AD URL must start with ldap:// or ldaps://');
            }
            if (config.url && config.url.startsWith('ldap://') && !config.url.includes('localhost')) {
                warnings.push('Using unencrypted LDAP (ldap://) over network is not recommended. Use ldaps:// for encryption.');
            }
            if (config.tlsOptions?.rejectUnauthorized === false) {
                warnings.push('TLS certificate validation is disabled. This is not recommended for production.');
            }
        }
        if (config.roleMappings) {
            for (const [adGroup, role] of Object.entries(config.roleMappings)) {
                if (!['admin', 'manager', 'auditor', 'user'].includes(role)) {
                    warnings.push(`Role mapping for "${adGroup}" uses unknown role: "${role}"`);
                }
            }
        }
        if (config.timeout && (config.timeout < 1000 || config.timeout > 30000)) {
            warnings.push(`AD timeout ${config.timeout}ms is outside recommended range (1000-30000ms)`);
        }
        if (config.connectTimeout && (config.connectTimeout < 1000 || config.connectTimeout > 30000)) {
            warnings.push(`AD connect timeout ${config.connectTimeout}ms is outside recommended range (1000-30000ms)`);
        }
        if (config.autoSyncSchedule) {
            const cronParts = config.autoSyncSchedule.split(' ');
            if (cronParts.length !== 5) {
                warnings.push(`Auto sync schedule "${config.autoSyncSchedule}" may not be a valid cron expression`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }
    catch (error) {
        return {
            isValid: false,
            errors: [`Configuration validation error: ${error.message}`],
            warnings: [],
        };
    }
}
function getSafeADConfig(config) {
    const safeConfig = { ...config };
    if (safeConfig.bindCredentials) {
        safeConfig.bindCredentials = '********';
    }
    delete safeConfig.password;
    delete safeConfig.secret;
    return safeConfig;
}
async function saveADConfigToFile(config, filePath) {
    try {
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const configJson = JSON.stringify(config, null, 2);
        fs.writeFileSync(filePath, configJson, 'utf8');
        return true;
    }
    catch (error) {
        console.error('Failed to save AD configuration:', error);
        return false;
    }
}
async function loadADConfigFromFile(filePath) {
    try {
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const configJson = fs.readFileSync(filePath, 'utf8');
        const configData = JSON.parse(configJson);
        const validatedConfig = exports.ADConfigSchema.parse({
            ...exports.defaultADConfig,
            ...configData,
        });
        return validatedConfig;
    }
    catch (error) {
        console.error('Failed to load AD configuration:', error);
        return null;
    }
}
function generateADEnvFile(config) {
    const envLines = [
        '# Active Directory Configuration',
        `AD_ENABLED=${config.enabled}`,
        `AD_URL=${config.url}`,
        `AD_TLS_ENABLED=${config.tlsEnabled}`,
        `AD_BIND_DN=${config.bindDN}`,
        `AD_BIND_CREDENTIALS=${config.bindCredentials}`,
        `AD_SEARCH_BASE=${config.searchBase}`,
        `AD_SEARCH_FILTER=${config.searchFilter}`,
        `AD_USERNAME_ATTRIBUTE=${config.usernameAttribute}`,
        `AD_EMAIL_ATTRIBUTE=${config.emailAttribute}`,
        `AD_GROUP_SEARCH_FILTER=${config.groupSearchFilter}`,
        `AD_ROLE_MAPPINGS=${JSON.stringify(config.roleMappings)}`,
        `AD_SYNC_DEPARTMENTS=${config.syncDepartments}`,
        `AD_DEPARTMENT_ATTRIBUTE=${config.departmentAttribute}`,
        `AD_AUTO_SYNC_ENABLED=${config.autoSyncEnabled}`,
        `AD_AUTO_SYNC_SCHEDULE=${config.autoSyncSchedule}`,
        `AD_SYNC_ON_LOGIN=${config.syncOnLogin}`,
        `AD_TIMEOUT=${config.timeout}`,
        `AD_CONNECT_TIMEOUT=${config.connectTimeout}`,
        `AD_IDLE_TIMEOUT=${config.idleTimeout}`,
        `AD_RECONNECT=${config.reconnect}`,
        `AD_STRICT_DN=${config.strictDN}`,
        `AD_SIZE_LIMIT=${config.sizeLimit}`,
        `AD_TIME_LIMIT=${config.timeLimit}`,
        `AD_FALLBACK_TO_LOCAL_AUTH=${config.fallbackToLocalAuth}`,
        `AD_ALLOW_MIXED_AUTH=${config.allowMixedAuth}`,
        `AD_LOG_AUTH_ATTEMPTS=${config.logAuthAttempts}`,
        `AD_LOG_SYNC_OPERATIONS=${config.logSyncOperations}`,
        `AD_LOG_LEVEL=${config.logLevel}`,
        '',
    ];
    return envLines.join('\n');
}
//# sourceMappingURL=ad.config.js.map