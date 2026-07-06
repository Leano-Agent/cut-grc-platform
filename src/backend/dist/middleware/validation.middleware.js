"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationMiddleware = void 0;
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../config/logger"));
class ValidationMiddleware {
    static validateBody(schema) {
        return (req, res, next) => {
            try {
                const validatedData = schema.parse(req.body);
                req.body = validatedData;
                next();
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    const errors = error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                        code: err.code
                    }));
                    res.status(400).json({
                        success: false,
                        error: 'Validation failed',
                        details: errors,
                        code: 'VALIDATION_ERROR'
                    });
                }
                else {
                    logger_1.default.error('Validation middleware error:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Internal server error during validation.',
                        code: 'VALIDATION_INTERNAL_ERROR'
                    });
                }
            }
        };
    }
    static validateQuery(schema) {
        return (req, res, next) => {
            try {
                const validatedData = schema.parse(req.query);
                req.query = validatedData;
                next();
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    const errors = error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                        code: err.code
                    }));
                    res.status(400).json({
                        success: false,
                        error: 'Query validation failed',
                        details: errors,
                        code: 'QUERY_VALIDATION_ERROR'
                    });
                }
                else {
                    logger_1.default.error('Query validation middleware error:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Internal server error during query validation.',
                        code: 'QUERY_VALIDATION_INTERNAL_ERROR'
                    });
                }
            }
        };
    }
    static validateParams(schema) {
        return (req, res, next) => {
            try {
                const validatedData = schema.parse(req.params);
                req.params = validatedData;
                next();
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    const errors = error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                        code: err.code
                    }));
                    res.status(400).json({
                        success: false,
                        error: 'Parameter validation failed',
                        details: errors,
                        code: 'PARAM_VALIDATION_ERROR'
                    });
                }
                else {
                    logger_1.default.error('Parameter validation middleware error:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Internal server error during parameter validation.',
                        code: 'PARAM_VALIDATION_INTERNAL_ERROR'
                    });
                }
            }
        };
    }
    static validateHeaders(schema) {
        return (req, res, next) => {
            try {
                const validatedData = schema.parse(req.headers);
                req.headers = { ...req.headers, ...validatedData };
                next();
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    const errors = error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                        code: err.code
                    }));
                    res.status(400).json({
                        success: false,
                        error: 'Header validation failed',
                        details: errors,
                        code: 'HEADER_VALIDATION_ERROR'
                    });
                }
                else {
                    logger_1.default.error('Header validation middleware error:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Internal server error during header validation.',
                        code: 'HEADER_VALIDATION_INTERNAL_ERROR'
                    });
                }
            }
        };
    }
    static sanitizeInput = (req, res, next) => {
        const sanitize = (obj) => {
            if (typeof obj === 'string') {
                return obj
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;')
                    .replace(/\//g, '&#x2F;');
            }
            if (Array.isArray(obj)) {
                return obj.map(sanitize);
            }
            if (obj && typeof obj === 'object') {
                const sanitized = {};
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        sanitized[key] = sanitize(obj[key]);
                    }
                }
                return sanitized;
            }
            return obj;
        };
        if (req.body)
            req.body = sanitize(req.body);
        if (req.query)
            req.query = sanitize(req.query);
        if (req.params)
            req.params = sanitize(req.params);
        next();
    };
    static validateFileUpload = (options) => {
        return (req, res, next) => {
            try {
                if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
                    if (req.file) {
                        const file = req.file;
                        if (options.maxSize && file.size > options.maxSize) {
                            res.status(400).json({
                                success: false,
                                error: `File too large. Maximum size: ${options.maxSize / 1024 / 1024}MB`,
                                code: 'FILE_TOO_LARGE'
                            });
                            return;
                        }
                        if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
                            res.status(400).json({
                                success: false,
                                error: `Invalid file type. Allowed types: ${options.allowedTypes.join(', ')}`,
                                code: 'INVALID_FILE_TYPE'
                            });
                            return;
                        }
                    }
                    else {
                        res.status(400).json({
                            success: false,
                            error: 'No files uploaded',
                            code: 'NO_FILES'
                        });
                        return;
                    }
                }
                else if (Array.isArray(req.files)) {
                    const files = req.files;
                    if (options.maxFiles && files.length > options.maxFiles) {
                        res.status(400).json({
                            success: false,
                            error: `Too many files. Maximum: ${options.maxFiles}`,
                            code: 'TOO_MANY_FILES'
                        });
                        return;
                    }
                    for (const file of files) {
                        if (options.maxSize && file.size > options.maxSize) {
                            res.status(400).json({
                                success: false,
                                error: `File "${file.originalname}" too large. Maximum size: ${options.maxSize / 1024 / 1024}MB`,
                                code: 'FILE_TOO_LARGE'
                            });
                            return;
                        }
                        if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
                            res.status(400).json({
                                success: false,
                                error: `File "${file.originalname}" has invalid type. Allowed types: ${options.allowedTypes.join(', ')}`,
                                code: 'INVALID_FILE_TYPE'
                            });
                            return;
                        }
                    }
                }
                next();
            }
            catch (error) {
                logger_1.default.error('File validation middleware error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error during file validation.',
                    code: 'FILE_VALIDATION_INTERNAL_ERROR'
                });
            }
        };
    };
    static schemas = {
        pagination: zod_1.z.object({
            page: zod_1.z.string().transform(val => parseInt(val, 10)).optional().default('1'),
            limit: zod_1.z.string().transform(val => parseInt(val, 10)).optional().default('20'),
            sortBy: zod_1.z.string().optional(),
            sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
            search: zod_1.z.string().optional(),
        }),
        uuid: zod_1.z.string().uuid('Invalid UUID format'),
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
        phone: zod_1.z.string()
            .regex(/^(\+27|0)[1-9][0-9]{8}$/, 'Invalid South African phone number'),
        date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
        url: zod_1.z.string().url('Invalid URL'),
        file: zod_1.z.object({
            fieldname: zod_1.z.string(),
            originalname: zod_1.z.string(),
            encoding: zod_1.z.string(),
            mimetype: zod_1.z.string(),
            size: zod_1.z.number(),
            destination: zod_1.z.string().optional(),
            filename: zod_1.z.string(),
            path: zod_1.z.string().optional(),
            buffer: zod_1.z.any().optional(),
        }),
    };
}
exports.ValidationMiddleware = ValidationMiddleware;
exports.default = ValidationMiddleware;
//# sourceMappingURL=validation.middleware.js.map