"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenBlacklist = exports.JWTService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config/config"));
const logger_1 = __importDefault(require("../config/logger"));
class JWTService {
    static ACCESS_TOKEN_EXPIRY = config_1.default.jwt.expiresIn;
    static REFRESH_TOKEN_EXPIRY = config_1.default.jwt.refreshExpiresIn;
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, config_1.default.jwt.secret, {
            expiresIn: this.ACCESS_TOKEN_EXPIRY,
            algorithm: 'HS256',
        });
    }
    static generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, config_1.default.jwt.refreshSecret, {
            expiresIn: this.REFRESH_TOKEN_EXPIRY,
            algorithm: 'HS256',
        });
    }
    static verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret, { algorithms: ['HS256'] });
        }
        catch (error) {
            logger_1.default.error('Access token verification failed:', error);
            return null;
        }
    }
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.default.jwt.refreshSecret, { algorithms: ['HS256'] });
        }
        catch (error) {
            logger_1.default.error('Refresh token verification failed:', error);
            return null;
        }
    }
    static decodeToken(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            logger_1.default.error('Token decoding failed:', error);
            return null;
        }
    }
    static isTokenExpired(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp)
                return true;
            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        }
        catch (error) {
            return true;
        }
    }
    static getTokenExpiration(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp)
                return null;
            return new Date(decoded.exp * 1000);
        }
        catch (error) {
            return null;
        }
    }
}
exports.JWTService = JWTService;
class TokenBlacklist {
    redis;
    constructor(redisClient) {
        this.redis = redisClient;
    }
    hasRedis() {
        return this.redis !== null && this.redis !== undefined;
    }
    async addToBlacklist(token, expirySeconds) {
        if (!this.hasRedis())
            return;
        const key = `blacklist:token:${token}`;
        await this.redis.setex(key, expirySeconds, '1');
    }
    async isBlacklisted(token) {
        if (!this.hasRedis())
            return false;
        const key = `blacklist:token:${token}`;
        const result = await this.redis.get(key);
        return result === '1';
    }
    async removeFromBlacklist(token) {
        if (!this.hasRedis())
            return;
        const key = `blacklist:token:${token}`;
        await this.redis.del(key);
    }
    async incrementRefreshTokenVersion(userId) {
        if (!this.hasRedis())
            return 0;
        const key = `user:${userId}:refreshTokenVersion`;
        const newVersion = await this.redis.incr(key);
        return newVersion;
    }
    async getRefreshTokenVersion(userId) {
        if (!this.hasRedis())
            return 0;
        const key = `user:${userId}:refreshTokenVersion`;
        const version = await this.redis.get(key);
        return version ? parseInt(version, 10) : 0;
    }
}
exports.TokenBlacklist = TokenBlacklist;
exports.default = JWTService;
//# sourceMappingURL=jwt.js.map