import { Application } from 'express';
declare class App {
    app: Application;
    port: number;
    private httpServer;
    private io;
    private redisPubClient;
    private redisSubClient;
    constructor();
    private initializeMiddlewares;
    private initializeDatabase;
    private initializeRedis;
    private initializeSocketIO;
    private initializeRoutes;
    private initializeErrorHandling;
    listen(): void;
    private shutdown;
}
declare const app: App;
export default app;
//# sourceMappingURL=server.d.ts.map