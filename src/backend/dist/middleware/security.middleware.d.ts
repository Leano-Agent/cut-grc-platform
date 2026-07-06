import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';
export declare class SecurityMiddleware {
    private redis;
    constructor(redisClient: Redis);
    static helmetConfig: () => (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
    static rateLimiter: () => import("express-rate-limit").RateLimitRequestHandler;
    static speedLimiter: () => any;
    bruteForceProtection: () => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    resetBruteForceCounter: () => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    static corsConfig: () => (req: Request, res: Response, next: NextFunction) => void;
    csrfProtection: () => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    static requestSizeLimit: () => (req: Request, res: Response, next: NextFunction) => void;
    static sqlInjectionProtection: () => (req: Request, res: Response, next: NextFunction) => void;
    static xssProtection: () => (req: Request, res: Response, next: NextFunction) => void;
    static securityLogging: () => (req: Request, res: Response, next: NextFunction) => void;
}
export default SecurityMiddleware;
//# sourceMappingURL=security.middleware.d.ts.map