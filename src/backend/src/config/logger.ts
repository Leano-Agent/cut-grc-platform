import winston from 'winston';
import config from './config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define the format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define which transports to use based on environment
const transports = [
  // Console transport for all environments
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }),
  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json(),
    ),
  }),
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json(),
    ),
  }),
];

// Security-specific transports
const securityTransports = [
  new winston.transports.File({
    filename: 'logs/security.log',
    level: 'warn',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json(),
    ),
  }),
];

// Create the main logger
const logger = winston.createLogger({
  level: config.logLevel,
  levels,
  format,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Create a security-specific logger
const securityLogger = winston.createLogger({
  level: 'warn',
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.json(),
  ),
  transports: securityTransports,
});

// Create a stream for Morgan (HTTP logging)
const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Log unhandled exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Don't exit in production, let the process manager handle it
  if (config.isProduction) {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Helper functions for structured logging
export const logSecurityEvent = (
  event: string,
  details: Record<string, any>,
  level: 'warn' | 'error' = 'warn'
) => {
  const logEntry = {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  };
  
  if (level === 'error') {
    securityLogger.error(event, logEntry);
  } else {
    securityLogger.warn(event, logEntry);
  }
  
  // Also log to main logger for visibility
  logger[level](`Security: ${event}`, details);
};

export const logAuthentication = (
  action: string,
  userId: string,
  ip: string,
  success: boolean,
  details?: Record<string, any>
) => {
  const logEntry = {
    action,
    userId,
    ip,
    success,
    timestamp: new Date().toISOString(),
    ...details,
  };
  
  securityLogger.info(`Authentication: ${action}`, logEntry);
  
  if (!success) {
    logger.warn(`Failed authentication: ${action} for user ${userId} from ${ip}`);
  }
};

export const logAuthorization = (
  action: string,
  userId: string,
  resource: string,
  allowed: boolean,
  details?: Record<string, any>
) => {
  const logEntry = {
    action,
    userId,
    resource,
    allowed,
    timestamp: new Date().toISOString(),
    ...details,
  };
  
  securityLogger.info(`Authorization: ${action}`, logEntry);
  
  if (!allowed) {
    logger.warn(`Unauthorized access attempt: ${action} on ${resource} by user ${userId}`);
  }
};

export const logDataAccess = (
  operation: string,
  userId: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, any>
) => {
  const logEntry = {
    operation,
    userId,
    resourceType,
    resourceId,
    timestamp: new Date().toISOString(),
    ...details,
  };
  
  securityLogger.info(`Data Access: ${operation}`, logEntry);
};

export const logSystemEvent = (
  event: string,
  component: string,
  details?: Record<string, any>
) => {
  const logEntry = {
    event,
    component,
    timestamp: new Date().toISOString(),
    ...details,
  };
  
  logger.info(`System: ${event} in ${component}`, logEntry);
};

export const logError = (
  error: Error,
  context?: string,
  details?: Record<string, any>
) => {
  const logEntry = {
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    ...details,
  };
  
  logger.error(`Error: ${error.message}`, logEntry);
};

export const logAudit = (
  action: string,
  userId: string,
  entityType: string,
  entityId: string,
  changes?: Record<string, any>,
  details?: Record<string, any>
) => {
  const logEntry = {
    action,
    userId,
    entityType,
    entityId,
    changes,
    timestamp: new Date().toISOString(),
    ...details,
  };
  
  securityLogger.info(`Audit: ${action}`, logEntry);
  logger.info(`Audit: ${action} on ${entityType} ${entityId} by user ${userId}`);
};

// Export the main logger and stream
export { logger, stream, securityLogger };
export default logger;