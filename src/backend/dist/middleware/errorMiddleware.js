"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = exports.sendError = exports.validateRequest = exports.asyncHandler = exports.notFound = exports.errorHandler = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
const logger_1 = __importDefault(require("../config/logger"));
const zod_1 = require("zod");
const jsonwebtoken_1 = require("jsonwebtoken");
class AppError extends Error {
    statusCode;
    isOperational;
    code;
    constructor(message, statusCode, code, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
    details;
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message, code = 'AUTHENTICATION_ERROR') {
        super(message, 401, code);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message, code = 'AUTHORIZATION_ERROR') {
        super(message, 403, code);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(message, code = 'NOT_FOUND') {
        super(message, 404, code);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message, code = 'CONFLICT') {
        super(message, 409, code);
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(message, retryAfter) {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
        this.retryAfter = retryAfter;
    }
    retryAfter;
}
exports.RateLimitError = RateLimitError;
const errorHandler = (error, req, res, next) => {
    logError(error, req);
    if (error instanceof zod_1.ZodError) {
        const errors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
        }));
        sendErrorResponse(res, 400, 'Validation failed', 'VALIDATION_ERROR', errors);
        return;
    }
    if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
        sendErrorResponse(res, 401, 'Invalid token', 'INVALID_TOKEN');
        return;
    }
    if (error instanceof jsonwebtoken_1.TokenExpiredError) {
        sendErrorResponse(res, 401, 'Token expired', 'TOKEN_EXPIRED');
        return;
    }
    if (error instanceof AppError) {
        const response = {
            success: false,
            error: error.message,
            code: error.code,
        };
        if (error instanceof ValidationError && error.details) {
            response.details = error.details;
        }
        if (error instanceof RateLimitError && error.retryAfter) {
            response.retryAfter = error.retryAfter;
        }
        res.status(error.statusCode).json(response);
        return;
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        sendErrorResponse(res, 409, 'Resource already exists', 'CONFLICT');
        return;
    }
    if (error.name === 'SequelizeValidationError') {
        sendErrorResponse(res, 400, 'Database validation failed', 'DB_VALIDATION_ERROR');
        return;
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        sendErrorResponse(res, 400, 'Referenced resource not found', 'FOREIGN_KEY_ERROR');
        return;
    }
    const statusCode = 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message;
    const devMsg = error.message;
    const devStack = error.stack ? error.stack.slice(0, 250) : '';
    console.error('[ERROR]', devMsg, devStack);
    sendErrorResponse(res, statusCode, message, 'INTERNAL_SERVER_ERROR', { error: devMsg, stack: devStack });
};
exports.errorHandler = errorHandler;
const logError = (error, req) => {
    const logData = {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId,
    };
    if (error instanceof AppError && error.isOperational) {
        logger_1.default.warn(`Operational error: ${error.message}`, logData);
    }
    else {
        logger_1.default.error(`Unexpected error: ${error.message}`, logData);
    }
};
const sendErrorResponse = (res, statusCode, message, code, details) => {
    const response = {
        success: false,
        error: message,
        code,
    };
    if (details) {
        response.details = details;
    }
    response.timestamp = new Date().toISOString();
    if (res.locals.requestId) {
        response.requestId = res.locals.requestId;
    }
    res.status(statusCode).json(response);
};
const notFound = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.originalUrl} not found`);
    next(error);
};
exports.notFound = notFound;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            const validated = schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
                headers: req.headers,
            });
            req.body = validated.body || req.body;
            req.query = validated.query || req.query;
            req.params = validated.params || req.params;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));
                next(new ValidationError('Validation failed', errors));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateRequest = validateRequest;
const sendError = (res, statusCode, message, code, details) => {
    const response = {
        success: false,
        error: message,
        code: code || 'ERROR',
    };
    if (details) {
        response.details = details;
    }
    res.status(statusCode).json(response);
};
exports.sendError = sendError;
const sendSuccess = (res, data, message, statusCode = 200) => {
    const response = {
        success: true,
        data,
    };
    if (message) {
        response.message = message;
    }
    res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
exports.default = exports.errorHandler;
//# sourceMappingURL=errorMiddleware.js.map