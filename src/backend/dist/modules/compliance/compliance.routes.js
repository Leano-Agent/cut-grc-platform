"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeComplianceRoutes = void 0;
const express_1 = require("express");
const errorMiddleware_1 = require("../../middleware/errorMiddleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
let authMiddleware;
const initializeComplianceRoutes = (redisClient) => {
    authMiddleware = new auth_middleware_1.AuthMiddleware(redisClient);
};
exports.initializeComplianceRoutes = initializeComplianceRoutes;
router.use((req, res, next) => authMiddleware.verifyToken(req, res, next));
let items = [
    { id: '1', regulation: 'POPIA', status: 'compliant', score: 95, lastReviewed: '2026-05-15', nextReview: '2026-08-15' },
    { id: '2', regulation: 'King IV', status: 'compliant', score: 88, lastReviewed: '2026-04-01', nextReview: '2026-07-01' },
    { id: '3', regulation: 'FICA', status: 'partial', score: 65, lastReviewed: '2026-03-01', nextReview: '2026-06-15' },
    { id: '4', regulation: 'GDPR', status: 'non_compliant', score: 40, lastReviewed: '2026-02-01', nextReview: '2026-05-15' },
];
let nextId = 5;
router.get('/', (0, errorMiddleware_1.asyncHandler)(async (_req, res) => {
    res.json({ data: items });
}));
router.get('/summary', (0, errorMiddleware_1.asyncHandler)(async (_req, res) => {
    res.json({ data: { total: 4, compliant: 2, partial: 1, nonCompliant: 1, overallScore: 72 } });
}));
router.get('/trends', (0, errorMiddleware_1.asyncHandler)(async (_req, res) => {
    res.json({
        data: [
            { month: 'Jan', score: 68 },
            { month: 'Feb', score: 70 },
            { month: 'Mar', score: 69 },
            { month: 'Apr', score: 72 },
        ],
    });
}));
router.post('/', (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const newItem = {
        id: `comp_${nextId++}`,
        ...req.body,
        createdAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    res.status(201).json({ data: newItem });
}));
router.put('/:id', (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const index = items.findIndex(i => i.id === req.params.id);
    if (index === -1) {
        res.status(404).json({ message: 'Compliance item not found' });
        return;
    }
    items[index] = { ...items[index], ...req.body, id: items[index].id };
    res.json({ data: items[index] });
}));
router.delete('/:id', (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const index = items.findIndex(i => i.id === req.params.id);
    if (index === -1) {
        res.status(404).json({ message: 'Compliance item not found' });
        return;
    }
    items.splice(index, 1);
    res.json({ message: 'Compliance item deleted successfully' });
}));
exports.default = router;
//# sourceMappingURL=compliance.routes.js.map