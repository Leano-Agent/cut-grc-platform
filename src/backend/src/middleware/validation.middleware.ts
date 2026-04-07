import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import logger from '../config/logger';

/**
 * Validation middleware using Zod schemas
 */
export class ValidationMiddleware {
  /**
   * Validate request body
   */
  static validateBody(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const validatedData = schema.parse(req.body);
        req.body = validatedData; // Replace with validated data
        next();
      } catch (error) {
        if (error instanceof ZodError) {
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
        } else {
          logger.error('Validation middleware error:', error);
          res.status(500).json({
            success: false,
            error: 'Internal server error during validation.',
            code: 'VALIDATION_INTERNAL_ERROR'
          });
        }
      }
    };
  }
  
  /**
   * Validate request query parameters
   */
  static validateQuery(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const validatedData = schema.parse(req.query);
        req.query = validatedData; // Replace with validated data
        next();
      } catch (error) {
        if (error instanceof ZodError) {
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
        } else {
          logger.error('Query validation middleware error:', error);
          res.status(500).json({
            success: false,
            error: 'Internal server error during query validation.',
            code: 'QUERY_VALIDATION_INTERNAL_ERROR'
          });
        }
      }
    };
  }
  
  /**
   * Validate request parameters (URL params)
   */
  static validateParams(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const validatedData = schema.parse(req.params);
        req.params = validatedData; // Replace with validated data
        next();
      } catch (error) {
        if (error instanceof ZodError) {
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
        } else {
          logger.error('Parameter validation middleware error:', error);
          res.status(500).json({
            success: false,
            error: 'Internal server error during parameter validation.',
            code: 'PARAM_VALIDATION_INTERNAL_ERROR'
          });
        }
      }
    };
  }
  
  /**
   * Validate request headers
   */
  static validateHeaders(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const validatedData = schema.parse(req.headers);
        req.headers = { ...req.headers, ...validatedData }; // Merge validated headers
        next();
      } catch (error) {
        if (error instanceof ZodError) {
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
        } else {
          logger.error('Header validation middleware error:', error);
          res.status(500).json({
            success: false,
            error: 'Internal server error during header validation.',
            code: 'HEADER_VALIDATION_INTERNAL_ERROR'
          });
        }
      }
    };
  }
  
  /**
   * Sanitize input to prevent XSS attacks
   */
  static sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        // Basic XSS prevention - escape HTML entities
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
        const sanitized: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            sanitized[key] = sanitize(obj[key]);
          }
        }
        return sanitized;
      }
      
      return obj;
    };
    
    // Sanitize body, query, and params
    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);
    
    next();
  };
  
  /**
   * Validate file uploads
   */
  static validateFileUpload = (options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxFiles?: number;
  }) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        // Check if files exist
        if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
          if (req.file) {
            // Single file upload
            const file = req.file;
            
            // Check file size
            if (options.maxSize && file.size > options.maxSize) {
              res.status(400).json({
                success: false,
                error: `File too large. Maximum size: ${options.maxSize / 1024 / 1024}MB`,
                code: 'FILE_TOO_LARGE'
              });
              return;
            }
            
            // Check file type
            if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
              res.status(400).json({
                success: false,
                error: `Invalid file type. Allowed types: ${options.allowedTypes.join(', ')}`,
                code: 'INVALID_FILE_TYPE'
              });
              return;
            }
          } else {
            // No files uploaded
            res.status(400).json({
              success: false,
              error: 'No files uploaded',
              code: 'NO_FILES'
            });
            return;
          }
        } else if (Array.isArray(req.files)) {
          // Multiple files upload
          const files = req.files;
          
          // Check number of files
          if (options.maxFiles && files.length > options.maxFiles) {
            res.status(400).json({
              success: false,
              error: `Too many files. Maximum: ${options.maxFiles}`,
              code: 'TOO_MANY_FILES'
            });
            return;
          }
          
          // Validate each file
          for (const file of files) {
            // Check file size
            if (options.maxSize && file.size > options.maxSize) {
              res.status(400).json({
                success: false,
                error: `File "${file.originalname}" too large. Maximum size: ${options.maxSize / 1024 / 1024}MB`,
                code: 'FILE_TOO_LARGE'
              });
              return;
            }
            
            // Check file type
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
      } catch (error) {
        logger.error('File validation middleware error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error during file validation.',
          code: 'FILE_VALIDATION_INTERNAL_ERROR'
        });
      }
    };
  };
  
  /**
   * Common validation schemas for reuse
   */
  static schemas = {
    // Pagination
    pagination: z.object({
      page: z.string().transform(val => parseInt(val, 10)).optional().default('1'),
      limit: z.string().transform(val => parseInt(val, 10)).optional().default('20'),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
      search: z.string().optional(),
    }),
    
    // UUID validation
    uuid: z.string().uuid('Invalid UUID format'),
    
    // Email validation
    email: z.string().email('Invalid email address'),
    
    // Password validation (minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char)
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    
    // Phone number validation (South African format)
    phone: z.string()
      .regex(/^(\+27|0)[1-9][0-9]{8}$/, 'Invalid South African phone number'),
    
    // Date validation
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    
    // URL validation
    url: z.string().url('Invalid URL'),
    
    // File validation
    file: z.object({
      fieldname: z.string(),
      originalname: z.string(),
      encoding: z.string(),
      mimetype: z.string(),
      size: z.number(),
      destination: z.string().optional(),
      filename: z.string(),
      path: z.string().optional(),
      buffer: z.any().optional(),
    }),
  };
}

export default ValidationMiddleware;