import winston from 'winston';
import config from '../config/config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define the format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define the format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Create the logger instance
const logger = winston.createLogger({
  level: config.logLevel,
  levels,
  format: fileFormat,
  defaultMeta: { service: 'cut-grc-backend' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: consoleFormat,
    }),
    
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Create logs directory if it doesn't exist
import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Add a stream for Morgan (HTTP logging)
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Helper methods for structured logging
export const logWithContext = (
  level: 'error' | 'warn' | 'info' | 'debug',
  message: string,
  context?: Record<string, any>
) => {
  const logMessage = context
    ? `${message} ${JSON.stringify(context)}`
    : message;
  
  logger.log(level, logMessage);
};

// Convenience methods
export const logError = (message: string, error?: Error, context?: Record<string, any>) => {
  const logContext = {
    ...context,
    error: error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : undefined,
  };
  
  logWithContext('error', message, logContext);
};

export const logWarn = (message: string, context?: Record<string, any>) => {
  logWithContext('warn', message, context);
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  logWithContext('info', message, context);
};

export const logDebug = (message: string, context?: Record<string, any>) => {
  logWithContext('debug', message, context);
};

// Database specific logging
export const logDatabaseQuery = (query: string, params: any[], duration: number) => {
  if (duration > 1000) {
    logWarn('Slow database query', {
      query: query.substring(0, 200),
      params: params?.slice(0, 5), // Limit params for logging
      duration,
    });
  } else if (config.isDevelopment) {
    logDebug('Database query executed', {
      query: query.substring(0, 200),
      params: params?.slice(0, 5),
      duration,
    });
  }
};

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    
    logInfo(`${method} ${originalUrl} ${statusCode} - ${duration}ms`, {
      method,
      url: originalUrl,
      statusCode,
      duration,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });
  });
  
  next();
};

export default logger;