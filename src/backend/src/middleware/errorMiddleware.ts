import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

/**
 * Custom error classes for better error handling
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
  
  public details?: any;
}

export class AuthenticationError extends AppError {
  constructor(message: string, code = 'AUTHENTICATION_ERROR') {
    super(message, 401, code);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, code = 'AUTHORIZATION_ERROR') {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
  
  public retryAfter?: number;
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logError(error, req);
  
  // Handle specific error types
  if (error instanceof ZodError) {
    // Zod validation error
    const errors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
    
    sendErrorResponse(res, 400, 'Validation failed', 'VALIDATION_ERROR', errors);
    return;
  }
  
  if (error instanceof JsonWebTokenError) {
    // JWT error
    sendErrorResponse(res, 401, 'Invalid token', 'INVALID_TOKEN');
    return;
  }
  
  if (error instanceof TokenExpiredError) {
    // JWT expired error
    sendErrorResponse(res, 401, 'Token expired', 'TOKEN_EXPIRED');
    return;
  }
  
  if (error instanceof AppError) {
    // Custom application error
    const response: any = {
      success: false,
      error: error.message,
      code: error.code,
    };
    
    // Add additional details for specific error types
    if (error instanceof ValidationError && error.details) {
      response.details = error.details;
    }
    
    if (error instanceof RateLimitError && error.retryAfter) {
      response.retryAfter = error.retryAfter;
    }
    
    res.status(error.statusCode).json(response);
    return;
  }
  
  // Handle database errors
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
  
  // Default to internal server error
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;
  
  sendErrorResponse(res, statusCode, message, 'INTERNAL_SERVER_ERROR');
};

/**
 * Log error with request context
 */
const logError = (error: Error, req: Request): void => {
  const logData = {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.userId,
  };
  
  if (error instanceof AppError && error.isOperational) {
    // Operational errors (expected errors)
    logger.warn(`Operational error: ${error.message}`, logData);
  } else {
    // Programming or unknown errors
    logger.error(`Unexpected error: ${error.message}`, logData);
  }
};

/**
 * Send standardized error response
 */
const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  code: string,
  details?: any
): void => {
  const response: any = {
    success: false,
    error: message,
    code,
  };
  
  if (details) {
    response.details = details;
  }
  
  // Add timestamp
  response.timestamp = new Date().toISOString();
  
  // Add request ID if available
  if (res.locals.requestId) {
    response.requestId = res.locals.requestId;
  }
  
  res.status(statusCode).json(response);
};

/**
 * 404 Not Found middleware
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Async error handler wrapper for async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Request validation middleware
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request against schema
      const validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
      });
      
      // Replace request data with validated data
      req.body = validated.body || req.body;
      req.query = validated.query || req.query;
      req.params = validated.params || req.params;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        next(new ValidationError('Validation failed', errors));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Error response utility for controllers
 */
export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  code?: string,
  details?: any
) => {
  const response: any = {
    success: false,
    error: message,
    code: code || 'ERROR',
  };
  
  if (details) {
    response.details = details;
  }
  
  res.status(statusCode).json(response);
};

/**
 * Success response utility for controllers
 */
export const sendSuccess = (
  res: Response,
  data: any,
  message?: string,
  statusCode = 200
) => {
  const response: any = {
    success: true,
    data,
  };
  
  if (message) {
    response.message = message;
  }
  
  res.status(statusCode).json(response);
};

export default errorHandler;