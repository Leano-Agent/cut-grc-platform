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
router.get('/', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const risks = [
        {
            id: 'risk_1',
            title: 'Data Security Breach',
            description: 'Potential unauthorized access to municipal data',
            category: 'security',
            severity: 'high',
            likelihood: 'medium',
            status: 'open',
            department: 'IT',
            assignedTo: 'user_1',
            dueDate: '2024-02-28',
            createdAt: '2024-01-15T09:00:00Z'
        },
        {
            id: 'risk_2',
            title: 'Budget Overrun',
            description: 'Infrastructure project exceeding allocated budget',
            category: 'financial',
            severity: 'medium',
            likelihood: 'high',
            status: 'in_progress',
            department: 'Finance',
            assignedTo: 'user_2',
            dueDate: '2024-03-15',
            createdAt: '2024-01-10T14:30:00Z'
        }
    ];
    (0, errorMiddleware_1.sendSuccess)(res, risks, 'Risks retrieved successfully');
}));
exports.default = router;
//# sourceMappingURL=risk.routes.js.map