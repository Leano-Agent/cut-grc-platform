import { z } from 'zod';

// AD Configuration Schema
export const ADConfigSchema = z.object({
  // Connection settings
  enabled: z.boolean().default(false),
  url: z.string().url().default('ldap://localhost:389'),
  tlsEnabled: z.boolean().default(false),
  tlsOptions: z.record(z.any()).default({ rejectUnauthorized: false }),
  
  // Authentication settings
  bindDN: z.string().default(''),
  bindCredentials: z.string().default(''),
  searchBase: z.string().default('DC=domain,DC=com'),
  
  // Search settings
  searchFilter: z.string().default('(objectClass=user)'),
  usernameAttribute: z.string().default('sAMAccountName'),
  emailAttribute: z.string().default('mail'),
  groupSearchFilter: z.string().default('(objectClass=group)'),
  
  // Mapping settings
  roleMappings: z.record(z.string()).default({
    'GRC_Admins': 'admin',
    'GRC_Managers': 'manager',
    'GRC_Auditors': 'auditor',
    'Domain Admins': 'admin',
    'Enterprise Admins': 'admin',
  }),
  
  // Department settings
  syncDepartments: z.boolean().default(true),
  departmentAttribute: z.string().default('department'),
  
  // Synchronization settings
  autoSyncEnabled: z.boolean().default(true),
  autoSyncSchedule: z.string().default('0 2 * * *'), // Daily at 2 AM
  syncOnLogin: z.boolean().default(true),
  
  // Timeout settings
  timeout: z.number().min(1000).max(30000).default(5000),
  connectTimeout: z.number().min(1000).max(30000).default(5000),
  idleTimeout: z.number().min(5000).max(60000).default(30000),
  
  // Advanced settings
  reconnect: z.boolean().default(true),
  strictDN: z.boolean().default(true),
  sizeLimit: z.number().min(1).max(10000).default(1000),
  timeLimit: z.number().min(1).max(300).default(30),
  
  // Fallback settings
  fallbackToLocalAuth: z.boolean().default(true),
  allowMixedAuth: z.boolean().default(false),
  
  // Logging settings
  logAuthAttempts: z.boolean().default(true),
  logSyncOperations: z.boolean().default(true),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type ADConfig = z.infer<typeof ADConfigSchema>;

// Default AD configuration
export const defaultADConfig: ADConfig = {
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

// AD Environment Variables Schema
export const ADEnvSchema = z.object({
  AD_ENABLED: z.string().transform(val => val === 'true'),
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
});

export type ADEnv = z.infer<typeof ADEnvSchema>;

/**
 * Load AD configuration from environment variables
 */
export function loadADConfigFromEnv(env: NodeJS.ProcessEnv): ADConfig {
  try {
    const envConfig = ADEnvSchema.parse(env);
    
    // Parse role mappings JSON
    let roleMappings = defaultADConfig.roleMappings;
    try {
      if (envConfig.AD_ROLE_MAPPINGS && envConfig.AD_ROLE_MAPPINGS !== '{}') {
        roleMappings = JSON.parse(envConfig.AD_ROLE_MAPPINGS);
      }
    } catch (error) {
      console.warn('Failed to parse AD_ROLE_MAPPINGS, using defaults');
    }
    
    // Parse TLS options
    let tlsOptions = defaultADConfig.tlsOptions;
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
  } catch (error) {
    console.error('Failed to load AD configuration from environment:', error);
    return defaultADConfig;
  }
}

/**
 * Validate AD configuration
 */
export function validateADConfig(config: Partial<ADConfig>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Basic validation
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
      
      // URL validation
      if (config.url && !config.url.startsWith('ldap://') && !config.url.startsWith('ldaps://')) {
        errors.push('AD URL must start with ldap:// or ldaps://');
      }
      
      // Security warnings
      if (config.url && config.url.startsWith('ldap://') && !config.url.includes('localhost')) {
        warnings.push('Using unencrypted LDAP (ldap://) over network is not recommended. Use ldaps:// for encryption.');
      }
      
      if (config.tlsOptions?.rejectUnauthorized === false) {
        warnings.push('TLS certificate validation is disabled. This is not recommended for production.');
      }
    }
    
    // Parse and validate role mappings
    if (config.roleMappings) {
      for (const [adGroup, role] of Object.entries(config.roleMappings)) {
        if (!['admin', 'manager', 'auditor', 'user'].includes(role)) {
          warnings.push(`Role mapping for "${adGroup}" uses unknown role: "${role}"`);
        }
      }
    }
    
    // Validate timeouts
    if (config.timeout && (config.timeout < 1000 || config.timeout > 30000)) {
      warnings.push(`AD timeout ${config.timeout}ms is outside recommended range (1000-30000ms)`);
    }
    
    if (config.connectTimeout && (config.connectTimeout < 1000 || config.connectTimeout > 30000)) {
      warnings.push(`AD connect timeout ${config.connectTimeout}ms is outside recommended range (1000-30000ms)`);
    }
    
    // Validate sync schedule
    if (config.autoSyncSchedule) {
      // Basic cron validation
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
  } catch (error: any) {
    return {
      isValid: false,
      errors: [`Configuration validation error: ${error.message}`],
      warnings: [],
    };
  }
}

/**
 * Get AD configuration for display (with sensitive data masked)
 */
export function getSafeADConfig(config: ADConfig): Partial<ADConfig> {
  const safeConfig: Partial<ADConfig> = { ...config };
  
  // Mask sensitive data
  if (safeConfig.bindCredentials) {
    safeConfig.bindCredentials = '********';
  }
  
  // Remove any other sensitive fields
  delete (safeConfig as any).password;
  delete (safeConfig as any).secret;
  
  return safeConfig;
}

/**
 * Save AD configuration to file
 */
export async function saveADConfigToFile(config: ADConfig, filePath: string): Promise<boolean> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write configuration
    const configJson = JSON.stringify(config, null, 2);
    fs.writeFileSync(filePath, configJson, 'utf8');
    
    return true;
  } catch (error) {
    console.error('Failed to save AD configuration:', error);
    return false;
  }
}

/**
 * Load AD configuration from file
 */
export async function loadADConfigFromFile(filePath: string): Promise<ADConfig | null> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const configJson = fs.readFileSync(filePath, 'utf8');
    const configData = JSON.parse(configJson);
    
    // Validate and merge with defaults
    const validatedConfig = ADConfigSchema.parse({
      ...defaultADConfig,
      ...configData,
    });
    
    return validatedConfig;
  } catch (error) {
    console.error('Failed to load AD configuration:', error);
    return null;
  }
}

/**
 * Generate .env file content for AD configuration
 */
export function generateADEnvFile(config: ADConfig): string {
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