"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeRiskRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const errorMiddleware_1 = require("../../middleware/errorMiddleware");
const router = (0, express_1.Router)();
let authMiddleware;
const initializeRiskRoutes = (redisClient) => {
    authMiddleware = new auth_middleware_1.AuthMiddleware(redisClient);
};
exports.initializeRiskRoutes = initializeRiskRoutes;
let risks = [
    {
        id: 'risk_1',
        title: 'Data Security Breach',
        description: 'Potential unauthorized access to municipal data',
        category: 'security',
        severity: 'high',
        likelihood: 'medium',
        impact: 'high',
        status: 'open',
        department: 'IT',
        assignedTo: 'user_1',
        owner: 'IT Manager',
        mitigation: 'Implement multi-factor authentication and regular security audits',
        dueDate: '2024-02-28',
        lastUpdated: '2024-01-15T09:00:00Z',
        createdAt: '2024-01-15T09:00:00Z',
    },
    {
        id: 'risk_2',
        title: 'Budget Overrun',
        description: 'Infrastructure project exceeding allocated budget',
        category: 'financial',
        severity: 'medium',
        likelihood: 'high',
        impact: 'high',
        status: 'in_progress',
        department: 'Finance',
        assignedTo: 'user_2',
        owner: 'Finance Director',
        mitigation: 'Monthly budget reviews and cost control measures',
        dueDate: '2024-03-15',
        lastUpdated: '2024-01-10T14:30:00Z',
        createdAt: '2024-01-10T14:30:00Z',
    },
];
let nextId = 3;
const authGuard = (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();
router.get('/', authGuard, (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    (0, errorMiddleware_1.sendSuccess)(res, risks, 'Risks retrieved successfully');
}));
router.get('/:id', authGuard, (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const risk = risks.find(r => r.id === req.params.id);
    if (!risk) {
        res.status(404).json({ message: 'Risk not found' });
        return;
    }
    (0, errorMiddleware_1.sendSuccess)(res, risk, 'Risk retrieved successfully');
}));
router.post('/', authGuard, (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const newRisk = {
        id: `risk_${nextId++}`,
        ...req.body,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
    };
    risks.unshift(newRisk);
    res.status(201).json({ data: newRisk });
}));
router.put('/:id', authGuard, (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const index = risks.findIndex(r => r.id === req.params.id);
    if (index === -1) {
        res.status(404).json({ message: 'Risk not found' });
        return;
    }
    risks[index] = {
        ...risks[index],
        ...req.body,
        id: risks[index].id,
        createdAt: risks[index].createdAt,
        lastUpdated: new Date().toISOString(),
    };
    res.json({ data: risks[index] });
}));
router.delete('/:id', authGuard, (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const index = risks.findIndex(r => r.id === req.params.id);
    if (index === -1) {
        res.status(404).json({ message: 'Risk not found' });
        return;
    }
    risks.splice(index, 1);
    res.json({ message: 'Risk deleted successfully' });
}));
exports.default = router;
//# sourceMappingURL=risk.routes.js.map