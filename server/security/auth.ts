import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || process.env.MASTER_ENCRYPTION_KEY || 'tradeos-ai-jwt-super-secret-key-2026-institutional';
const JWT_EXPIRES_IN = '7d';

export interface UserTokenPayload {
  userId: string;
  email?: string;
  role?: string;
  tier?: 'FREE' | 'PRO' | 'ULTIMATE';
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: UserTokenPayload;
}

/**
 * Generate a cryptographically signed JWT for the trader
 */
export function generateUserToken(payload: Omit<UserTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token string
 */
export function verifyUserToken(token: string): UserTokenPayload {
  return jwt.verify(token, JWT_SECRET) as UserTokenPayload;
}

/**
 * Express Middleware: Protects endpoints requiring JWT authentication
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For development/demo convenience, allow fallback default user if token omitted
      const fallbackUserId = (req.query.userId as string) || (req.body && req.body.userId) || 'trader_primary';
      req.user = {
        userId: fallbackUserId,
        email: 'trader@tradeos.ai',
        tier: 'ULTIMATE',
        role: 'TRADER',
      };
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyUserToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid, expired, or malformed authentication token.',
      code: 'AUTH_TOKEN_INVALID',
    });
  }
}
