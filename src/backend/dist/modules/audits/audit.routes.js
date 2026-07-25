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
let items = [
    { id: '1', title: 'Financial Audit Q2', status: 'in_progress', priority: 'high', assignee: 'Audit Team A', dueDate: '2026-06-30', createdAt: '2026-05-01T09:00:00Z', scope: 'Financial statements and controls' },
    { id: '2', title: 'IT Security Audit', status: 'completed', priority: 'high', assignee: 'External Auditor', dueDate: '2026-05-15', createdAt: '2026-04-01T14:00:00Z', scope: 'Network security and access controls' },
    { id: '3', title: 'Compliance Review', status: 'planned', priority: 'medium', assignee: 'Compliance Dept', dueDate: '2026-08-01', createdAt: '2026-06-01T11:00:00Z', scope: 'Regulatory compliance assessment' },
];
let nextId = 4;
router.get('/summary', (0, errorMiddleware_1.asyncHandler)(async (_req, res) => {
    res.json({ data: { total: 3, completed: 1, inProgress: 1, planned: 1, overdue: 0 } });
}));
router.get('/', (0, errorMiddleware_1.asyncHandler)(async (_req, res) => {
    res.json({ data: items });
}));
router.post('/', (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const newItem = {
        id: `audit_${nextId++}`,
        ...req.body,
        createdAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    res.status(201).json({ data: newItem });
}));
router.put('/:id', (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const index = items.findIndex(i => i.id === req.params.id);
    if (index === -1) {
        res.status(404).json({ message: 'Audit not found' });
        return;
    }
    items[index] = { ...items[index], ...req.body, id: items[index].id };
    res.json({ data: items[index] });
}));
router.delete('/:id', (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const index = items.findIndex(i => i.id === req.params.id);
    if (index === -1) {
        res.status(404).json({ message: 'Audit not found' });
        return;
    }
    items.splice(index, 1);
    res.json({ message: 'Audit deleted successfully' });
}));
exports.default = router;
//# sourceMappingURL=audit.routes.js.map