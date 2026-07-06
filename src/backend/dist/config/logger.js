"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityLogger = exports.stream = exports.logger = exports.logAudit = exports.logError = exports.logSystemEvent = exports.logDataAccess = exports.logAuthorization = exports.logAuthentication = exports.logSecurityEvent = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = __importDefault(require("./config"));
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston_1.default.addColors(colors);
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
const transports = [
    new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
    }),
    new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston_1.default.format.combine(winston_1.default.format.uncolorize(), winston_1.default.format.json()),
    }),
    new winston_1.default.transports.File({
        filename: 'logs/combined.log',
        format: winston_1.default.format.combine(winston_1.default.format.uncolorize(), winston_1.default.format.json()),
    }),
];
const securityTransports = [
    new winston_1.default.transports.File({
        filename: 'logs/security.log',
        level: 'warn',
        format: winston_1.default.format.combine(winston_1.default.format.uncolorize(), winston_1.default.format.json()),
    }),
];
const logger = winston_1.default.createLogger({
    level: config_1.default.logLevel,
    levels,
    format,
    transports,
    exitOnError: false,
});
exports.logger = logger;
const securityLogger = winston_1.default.createLogger({
    level: 'warn',
    levels,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.json()),
    transports: securityTransports,
});
exports.securityLogger = securityLogger;
const stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};
exports.stream = stream;
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    if (config_1.default.isProduction) {
        process.exit(1);
    }
});
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
const logSecurityEvent = (event, details, level = 'warn') => {
    const logEntry = {
        event,
        timestamp: new Date().toISOString(),
        ...details,
    };
    if (level === 'error') {
        securityLogger.error(event, logEntry);
    }
    else {
        securityLogger.warn(event, logEntry);
    }
    logger[level](`Security: ${event}`, details);
};
exports.logSecurityEvent = logSecurityEvent;
const logAuthentication = (action, userId, ip, success, details) => {
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
exports.logAuthentication = logAuthentication;
const logAuthorization = (action, userId, resource, allowed, details) => {
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
exports.logAuthorization = logAuthorization;
const logDataAccess = (operation, userId, resourceType, resourceId, details) => {
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
exports.logDataAccess = logDataAccess;
const logSystemEvent = (event, component, details) => {
    const logEntry = {
        event,
        component,
        timestamp: new Date().toISOString(),
        ...details,
    };
    logger.info(`System: ${event} in ${component}`, logEntry);
};
exports.logSystemEvent = logSystemEvent;
const logError = (error, context, details) => {
    const logEntry = {
        error: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        ...details,
    };
    logger.error(`Error: ${error.message}`, logEntry);
};
exports.logError = logError;
const logAudit = (action, userId, entityType, entityId, changes, details) => {
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
exports.logAudit = logAudit;
exports.default = logger;
//# sourceMappingURL=logger.js.map