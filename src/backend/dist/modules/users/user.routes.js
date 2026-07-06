"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeUserRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const errorMiddleware_1 = require("../../middleware/errorMiddleware");
const router = (0, express_1.Router)();
let authMiddleware;
const initializeUserRoutes = (redisClient) => {
    authMiddleware = new auth_middleware_1.AuthMiddleware(redisClient);
};
exports.initializeUserRoutes = initializeUserRoutes;
router.get('/', (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next(), (req, res, next) => authMiddleware ? authMiddleware.requireAnyRole(['admin'])(req, res, next) : next(), (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const users = [
        {
            id: 'user_1',
            email: 'admin@municipal.gov',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            department: 'IT',
            isActive: true,
            lastLogin: '2024-01-20T10:30:00Z'
        },
        {
            id: 'user_2',
            email: 'manager@municipal.gov',
            firstName: 'Department',
            lastName: 'Manager',
            role: 'manager',
            department: 'Finance',
            isActive: true,
            lastLogin: '2024-01-19T14:20:00Z'
        }
    ];
    (0, errorMiddleware_1.sendSuccess)(res, users, 'Users retrieved successfully');
}));
exports.default = router;
//# sourceMappingURL=user.routes.js.map