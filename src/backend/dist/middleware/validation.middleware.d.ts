import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export declare class ValidationMiddleware {
    static validateBody(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
    static validateQuery(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
    static validateParams(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
    static validateHeaders(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
    static sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
    static validateFileUpload: (options: {
        maxSize?: number;
        allowedTypes?: string[];
        maxFiles?: number;
    }) => (req: Request, res: Response, next: NextFunction) => void;
    static schemas: {
        pagination: any;
        uuid: any;
        email: any;
        password: any;
        phone: any;
        date: any;
        url: any;
        file: any;
    };
}
export default ValidationMiddleware;
//# sourceMappingURL=validation.middleware.d.ts.map