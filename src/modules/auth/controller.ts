
import { env } from '@config/index';
import { AppError } from '@core/errors';
import { createSuccessResponse } from '@core/http/response';
import { Role } from '@prisma/client';
import type { Request, Response } from 'express';

import { AuthService } from './service';

const REFRESH_TOKEN_COOKIE = 'refresh_token';

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'strict' : 'lax',
  path: '/api/auth/refresh'
} as const;

const clearCookieOptions = {
  ...refreshCookieOptions,
  maxAge: 0
} as const;

export class AuthController {
  constructor(private readonly service = new AuthService()) {}

  signup = async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, roles, employee } = req.body;

    const createdUser = await this.service.register({
      email,
      password,
      firstName,
      lastName,
      roles: (roles as Role[]) ?? [Role.EMPLOYEE],
      employee
    });

    return res.status(201).json(createSuccessResponse(createdUser, 'User created'));
  };

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await this.service.login({
      email,
      password,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip
    });

    this.setRefreshCookie(res, result.tokens.refreshToken, result.tokens.refreshTokenExpiresAt);

    return res.json(
      createSuccessResponse({
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshTokenExpiresAt: result.tokens.refreshTokenExpiresAt
      }, 'Logged in successfully')
    );
  };

  refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] ?? req.body?.refreshToken;
    if (!refreshToken) {
      throw AppError.unauthorized('Refresh token missing');
    }

    const result = await this.service.refresh({
      refreshToken,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip
    });

    this.setRefreshCookie(res, result.tokens.refreshToken, result.tokens.refreshTokenExpiresAt);

    return res.json(
      createSuccessResponse({
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshTokenExpiresAt: result.tokens.refreshTokenExpiresAt
      }, 'Token refreshed')
    );
  };

  logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] ?? req.body?.refreshToken;
    await this.service.logout(refreshToken);
    res.clearCookie(REFRESH_TOKEN_COOKIE, clearCookieOptions);
    return res.json(createSuccessResponse({ success: true }, 'Logged out'));
  };

  logoutAll = async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    await this.service.logoutAll(req.user.id);
    res.clearCookie(REFRESH_TOKEN_COOKIE, clearCookieOptions);
    return res.json(createSuccessResponse({ success: true }, 'Logged out of all sessions'));
  };

  requestPasswordReset = async (_req: Request, res: Response) => {
    // Production-ready implementation would enqueue an email.
    return res
      .status(202)
      .json(createSuccessResponse({ queued: true }, 'Password reset instructions will be sent if the user exists'));
  };

  resetPassword = async (_req: Request, res: Response) => {
    return res.status(501).json(createSuccessResponse({ supported: false }, 'Reset password flow not yet implemented'));
  };

  private setRefreshCookie(res: Response, token: string, expiresAt: Date) {
    const maxAge = Math.max(expiresAt.getTime() - Date.now(), 0);
    res.cookie(REFRESH_TOKEN_COOKIE, token, { ...refreshCookieOptions, maxAge });
  }
}

