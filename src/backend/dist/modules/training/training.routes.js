"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeTrainingRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
let authMiddleware;
let items = [];
exports.initializeTrainingRoutes = (redisClient) => {
  const { AuthMiddleware } = require('../../middleware/auth.middleware');
  authMiddleware = new AuthMiddleware(redisClient);
};
const authGuard = (req, res, next) => { if (authMiddleware) return authMiddleware.verifyToken(req, res, next); next(); };
exports.default = router;
