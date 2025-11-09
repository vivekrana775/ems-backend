import { AppError } from '@core/errors';
import { verifyAccessToken } from '@utils/jwt';
import type { NextFunction, Request, Response } from 'express';

const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  if (req.cookies?.access_token) {
    return req.cookies.access_token as string;
  }

  return null;
};

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    throw AppError.unauthorized('Authentication token missing');
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, roles: payload.roles as any, tokenPayload: payload };
    next();
  } catch {
    throw AppError.unauthorized('Invalid or expired token');
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    if (allowedRoles.length === 0) {
      return next();
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      throw AppError.forbidden('Insufficient permissions');
    }

    return next();
  };
};

