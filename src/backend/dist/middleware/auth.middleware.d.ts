import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role: string;
                permissions: string[];
            };
        }
    }
}
export declare class AuthMiddleware {
    private tokenBlacklist;
    constructor(redisClient: Redis);
    verifyToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireRole: (requiredRole: string) => (req: Request, res: Response, next: NextFunction) => void;
    requireAnyRole: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
    requirePermission: (requiredPermission: string) => (req: Request, res: Response, next: NextFunction) => void;
    requireAnyPermission: (allowedPermissions: string[]) => (req: Request, res: Response, next: NextFunction) => void;
    optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    logout: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export default AuthMiddleware;
//# sourceMappingURL=auth.middleware.d.ts.map