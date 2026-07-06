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
        pagination: z.ZodObject<{
            page: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
            limit: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
            sortBy: z.ZodOptional<z.ZodString>;
            sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
            search: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            page?: number;
            limit?: number;
            sortBy?: string;
            sortOrder?: "asc" | "desc";
            search?: string;
        }, {
            page?: string;
            limit?: string;
            sortBy?: string;
            sortOrder?: "asc" | "desc";
            search?: string;
        }>;
        uuid: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        phone: z.ZodString;
        date: z.ZodString;
        url: z.ZodString;
        file: z.ZodObject<{
            fieldname: z.ZodString;
            originalname: z.ZodString;
            encoding: z.ZodString;
            mimetype: z.ZodString;
            size: z.ZodNumber;
            destination: z.ZodOptional<z.ZodString>;
            filename: z.ZodString;
            path: z.ZodOptional<z.ZodString>;
            buffer: z.ZodOptional<z.ZodAny>;
        }, "strip", z.ZodTypeAny, {
            path?: string;
            fieldname?: string;
            originalname?: string;
            encoding?: string;
            mimetype?: string;
            size?: number;
            destination?: string;
            filename?: string;
            buffer?: any;
        }, {
            path?: string;
            fieldname?: string;
            originalname?: string;
            encoding?: string;
            mimetype?: string;
            size?: number;
            destination?: string;
            filename?: string;
            buffer?: any;
        }>;
    };
}
export default ValidationMiddleware;
//# sourceMappingURL=validation.middleware.d.ts.map