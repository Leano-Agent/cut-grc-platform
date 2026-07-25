"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePolicyRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
let authMiddleware;
let items = [];
exports.initializePolicyRoutes = (redisClient) => {
  const { AuthMiddleware } = require('../../middleware/auth.middleware');
  authMiddleware = new AuthMiddleware(redisClient);
};
const authGuard = (req, res, next) => { if (authMiddleware) return authMiddleware.verifyToken(req, res, next); next(); };
exports.default = router;
