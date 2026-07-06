import winston from 'winston';
declare const logger: winston.Logger;
export declare const stream: {
    write: (message: string) => void;
};
export declare const logWithContext: (level: "error" | "warn" | "info" | "debug", message: string, context?: Record<string, any>) => void;
export declare const logError: (message: string, error?: Error, context?: Record<string, any>) => void;
export declare const logWarn: (message: string, context?: Record<string, any>) => void;
export declare const logInfo: (message: string, context?: Record<string, any>) => void;
export declare const logDebug: (message: string, context?: Record<string, any>) => void;
export declare const logDatabaseQuery: (query: string, params: any[], duration: number) => void;
export declare const requestLogger: (req: any, res: any, next: any) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map