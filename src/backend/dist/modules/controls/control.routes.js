"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeControlRoutes = void 0;
const express_1 = require("express");
const errorMiddleware_1 = require("../../middleware/errorMiddleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
let authMiddleware;
const initializeControlRoutes = (redisClient) => {
    authMiddleware = new auth_middleware_1.AuthMiddleware(redisClient);
};
exports.initializeControlRoutes = initializeControlRoutes;
router.use((req, res, next) => authMiddleware.verifyToken(req, res, next));
router.get('/', (0, errorMiddleware_1.asyncHandler)(async (_req, res) => {
    res.json({
        data: [
            { id: '1', name: 'Access Control Review', category: 'IT', status: 'active', effectiveness: 'high', lastTested: '2026-05-01' },
            { id: '2', name: 'Financial Approval Process', category: 'Finance', status: 'active', effectiveness: 'medium', lastTested: '2026-04-15' },
            { id: '3', name: 'Data Backup Verification', category: 'IT', status: 'active', effectiveness: 'high', lastTested: '2026-05-20' },
            { id: '4', name: 'Vendor Due Diligence', category: 'Procurement', status: 'inactive', effectiveness: 'low', lastTested: '2026-03-01' },
        ],
    });
}));
router.get('/summary', (0, errorMiddleware_1.asyncHandler)(async (_req, res) => {
    res.json({
        data: { total: 4, active: 3, inactive: 1, highEffectiveness: 2, mediumEffectiveness: 1, lowEffectiveness: 1 },
    });
}));
router.post('/', (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    res.status(201).json({ data: { id: 'new', ...req.body, createdAt: new Date().toISOString() } });
}));
exports.default = router;
//# sourceMappingURL=control.routes.js.map