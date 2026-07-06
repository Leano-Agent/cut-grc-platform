import winston from 'winston';
declare const logger: winston.Logger;
declare const securityLogger: winston.Logger;
declare const stream: {
    write: (message: string) => void;
};
export declare const logSecurityEvent: (event: string, details: Record<string, any>, level?: "warn" | "error") => void;
export declare const logAuthentication: (action: string, userId: string, ip: string, success: boolean, details?: Record<string, any>) => void;
export declare const logAuthorization: (action: string, userId: string, resource: string, allowed: boolean, details?: Record<string, any>) => void;
export declare const logDataAccess: (operation: string, userId: string, resourceType: string, resourceId: string, details?: Record<string, any>) => void;
export declare const logSystemEvent: (event: string, component: string, details?: Record<string, any>) => void;
export declare const logError: (error: Error, context?: string, details?: Record<string, any>) => void;
export declare const logAudit: (action: string, userId: string, entityType: string, entityId: string, changes?: Record<string, any>, details?: Record<string, any>) => void;
export { logger, stream, securityLogger };
export default logger;
//# sourceMappingURL=logger.d.ts.map