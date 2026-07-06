import { Redis } from 'ioredis';
export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
}
export interface RefreshTokenPayload {
    userId: string;
    tokenVersion: number;
}
export declare class JWTService {
    private static readonly ACCESS_TOKEN_EXPIRY;
    private static readonly REFRESH_TOKEN_EXPIRY;
    static generateAccessToken(payload: TokenPayload): string;
    static generateRefreshToken(payload: RefreshTokenPayload): string;
    static verifyAccessToken(token: string): TokenPayload | null;
    static verifyRefreshToken(token: string): RefreshTokenPayload | null;
    static decodeToken(token: string): any;
    static isTokenExpired(token: string): boolean;
    static getTokenExpiration(token: string): Date | null;
}
export declare class TokenBlacklist {
    private redis;
    constructor(redisClient: Redis | null);
    private hasRedis;
    addToBlacklist(token: string, expirySeconds: number): Promise<void>;
    isBlacklisted(token: string): Promise<boolean>;
    removeFromBlacklist(token: string): Promise<void>;
    incrementRefreshTokenVersion(userId: string): Promise<number>;
    getRefreshTokenVersion(userId: string): Promise<number>;
}
export default JWTService;
//# sourceMappingURL=jwt.d.ts.map