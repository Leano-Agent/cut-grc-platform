"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAuditRoutes = void 0;
const express_1 = require("express");
const errorMiddleware_1 = require("../../middleware/errorMiddleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
let authMiddleware;
const initializeAuditRoutes = (redisClient) => {
    authMiddleware = new auth_middleware_1.AuthMiddleware(redisClient);
};
exports.initializeAuditRoutes = initializeAuditRoutes;
router.use((req, res, next) => authMiddleware.verifyToken(req, res, next));
router.get('/', (0, errorMiddleware_1.asyncHandler)(async (_req, res) => {
    res.json({
        data: [
            { id: '1', title: 'Q2 Financial Audit', status: 'in_progress', priority: 'high', assignee: 'Audit Team', dueDate: '2026-07-15', createdAt: '2026-05-01' },
            { id: '2', title: 'IT Security Audit', status: 'completed', priority: 'critical', assignee: 'Security Team', dueDate: '2026-06-01', createdAt: '2026-04-15' },
            { id: '3', title: 'Compliance Review', status: 'planned', priority: 'medium', assignee: 'Compliance Dept', dueDate: '2026-08-01', createdAt: '2026-06-01' },
        ],
    });
}));
router.get('/summary', (0, errorMiddleware_1.asyncHandler)(async (_req, res) => {
    res.json({
        data: { total: 3, completed: 1, inProgress: 1, planned: 1, overdue: 0 },
    });
}));
router.post('/', (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    res.status(201).json({ data: { id: 'new', ...req.body, createdAt: new Date().toISOString() } });
}));
exports.default = router;
//# sourceMappingURL=audit.routes.js.map