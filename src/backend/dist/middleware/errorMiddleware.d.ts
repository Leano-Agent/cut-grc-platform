import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    code?: string;
    constructor(message: string, statusCode: number, code?: string, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: any);
    details?: any;
}
export declare class AuthenticationError extends AppError {
    constructor(message: string, code?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message: string, code?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message: string, code?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string, code?: string);
}
export declare class RateLimitError extends AppError {
    constructor(message: string, retryAfter?: number);
    retryAfter?: number;
}
export declare const errorHandler: (error: Error | AppError, req: Request, res: Response, next: NextFunction) => void;
export declare const notFound: (req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateRequest: (schema: any) => (req: Request, res: Response, next: NextFunction) => void;
export declare const sendError: (res: Response, statusCode: number, message: string, code?: string, details?: any) => void;
export declare const sendSuccess: (res: Response, data: any, message?: string, statusCode?: number) => void;
export default errorHandler;
//# sourceMappingURL=errorMiddleware.d.ts.map