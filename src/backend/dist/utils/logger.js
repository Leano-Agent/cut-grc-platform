"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.logDatabaseQuery = exports.logDebug = exports.logInfo = exports.logWarn = exports.logError = exports.logWithContext = exports.stream = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = __importDefault(require("../config/config"));
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
};
winston_1.default.addColors(colors);
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.json());
const logger = winston_1.default.createLogger({
    level: config_1.default.logLevel,
    levels,
    format: fileFormat,
    defaultMeta: { service: 'ngome-backend' },
    transports: [
        new winston_1.default.transports.Console({
            format: consoleFormat,
        }),
        new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston_1.default.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5,
        }),
    ],
});
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logsDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
exports.stream = {
    write: (message) => {
        logger.info(message.trim());
    },
};
const logWithContext = (level, message, context) => {
    const logMessage = context
        ? `${message} ${JSON.stringify(context)}`
        : message;
    logger.log(level, logMessage);
};
exports.logWithContext = logWithContext;
const logError = (message, error, context) => {
    const logContext = {
        ...context,
        error: error ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
        } : undefined,
    };
    (0, exports.logWithContext)('error', message, logContext);
};
exports.logError = logError;
const logWarn = (message, context) => {
    (0, exports.logWithContext)('warn', message, context);
};
exports.logWarn = logWarn;
const logInfo = (message, context) => {
    (0, exports.logWithContext)('info', message, context);
};
exports.logInfo = logInfo;
const logDebug = (message, context) => {
    (0, exports.logWithContext)('debug', message, context);
};
exports.logDebug = logDebug;
const logDatabaseQuery = (query, params, duration) => {
    if (duration > 1000) {
        (0, exports.logWarn)('Slow database query', {
            query: query.substring(0, 200),
            params: params?.slice(0, 5),
            duration,
        });
    }
    else if (config_1.default.isDevelopment) {
        (0, exports.logDebug)('Database query executed', {
            query: query.substring(0, 200),
            params: params?.slice(0, 5),
            duration,
        });
    }
};
exports.logDatabaseQuery = logDatabaseQuery;
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const { method, originalUrl } = req;
        const { statusCode } = res;
        (0, exports.logInfo)(`${method} ${originalUrl} ${statusCode} - ${duration}ms`, {
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
exports.requestLogger = requestLogger;
exports.default = logger;
//# sourceMappingURL=logger.js.map