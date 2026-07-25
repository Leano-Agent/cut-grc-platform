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
const authGuard = (req, res, next) => authMiddleware ? authMiddleware.verifyToken(req, res, next) : next();
const adminGuard = (req, res, next) => authMiddleware ? authMiddleware.requireAnyRole(['admin'])(req, res, next) : next();
let users = [
    {
        id: 'user_1',
        email: 'grcadmin@tyriie.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        department: 'IT',
        isActive: true,
        lastLogin: '2024-01-20T10:30:00Z',
        createdAt: '2024-01-01T08:00:00Z',
    },
    {
        id: 'user_2',
        email: 'manager@municipal.gov',
        firstName: 'Department',
        lastName: 'Manager',
        role: 'manager',
        department: 'Finance',
        isActive: true,
        lastLogin: '2024-01-19T14:20:00Z',
        createdAt: '2024-01-02T09:00:00Z',
    },
];
let nextId = 3;
router.get('/', authGuard, adminGuard, (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    res.json({ data: users });
}));
router.get('/:id', authGuard, adminGuard, (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    res.json({ data: user });
}));
router.post('/', authGuard, adminGuard, (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const newUser = {
        id: `user_${nextId++}`,
        email: req.body.email,
        firstName: req.body.firstName || '',
        lastName: req.body.lastName || '',
        role: req.body.role || 'user',
        department: req.body.department || '',
        isActive: true,
        lastLogin: null,
        createdAt: new Date().toISOString(),
    };
    users.unshift(newUser);
    res.status(201).json({ data: newUser });
}));
router.put('/:id', authGuard, adminGuard, (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    users[index] = { ...users[index], ...req.body, id: users[index].id, createdAt: users[index].createdAt };
    res.json({ data: users[index] });
}));
router.delete('/:id', authGuard, adminGuard, (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    users.splice(index, 1);
    res.json({ message: 'User deleted successfully' });
}));
router.put('/:id/status', authGuard, adminGuard, (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    users[index].isActive = !users[index].isActive;
    res.json({ data: users[index] });
}));
exports.default = router;
//# sourceMappingURL=user.routes.js.map