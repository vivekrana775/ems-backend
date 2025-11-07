
import { env } from '@config';
import { AppError } from '@core/errors';
import { EmploymentStatus, Role, type User } from '@prisma/client';
import {
  comparePassword,
  generateId,
  hashPassword,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from '@utils';
import ms from 'ms';

import { AuthRepository } from './repository';

type RegisterInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  employee?: {
    employeeCode: string;
    department?: string | null;
    jobTitle?: string | null;
    status?: EmploymentStatus;
    managerId?: string | null;
    hireDate?: Date | null;
    phone?: string | null;
    location?: string | null;
  };
};

type LoginInput = {
  email: string;
  password: string;
  userAgent?: string | null;
  ipAddress?: string | null;
};

type RefreshInput = {
  refreshToken: string;
  userAgent?: string | null;
  ipAddress?: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  status: EmploymentStatus | null;
};

const refreshTokenTtlMs = ms(env.JWT_REFRESH_EXPIRES_IN);

if (typeof refreshTokenTtlMs !== 'number') {
  throw new Error('Invalid JWT_REFRESH_EXPIRES_IN configuration');
}

export class AuthService {
  constructor(private readonly repository = new AuthRepository()) {}

  async register(input: RegisterInput) {
    const existingUser = await this.repository.findUserByEmail(input.email);
    if (existingUser) {
      throw AppError.badRequest('Email already in use');
    }

    const roles = input.roles.length > 0 ? input.roles : [Role.EMPLOYEE];
    const passwordHash = await hashPassword(input.password);
    const user = await this.repository.createUser({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      roles,
      employee: input.employee,
      passwordHash
    });

    return this.mapToAuthUser(user);
  }

  async login({ email, password, userAgent, ipAddress }: LoginInput) {
    const user = await this.repository.findUserByEmail(email);
    if (!user) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);
    if (!passwordMatches) {
      throw AppError.unauthorized('Invalid credentials');
    }

    if (!user.isActive) {
      throw AppError.forbidden('User account is disabled');
    }

    await this.repository.recordLogin(user.id);

    const tokens = await this.generateTokens(user, { userAgent, ipAddress });

    return {
      user: this.mapToAuthUser(user),
      tokens
    };
  }

  async refresh({ refreshToken, userAgent, ipAddress }: RefreshInput) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized('Invalid refresh token');
    }

    if (!payload.tokenId) {
      throw AppError.unauthorized('Refresh token missing identifier');
    }

    const tokenHash = hashToken(refreshToken);
    const storedToken = await this.repository.findRefreshTokenByHash(tokenHash);

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt.getTime() < Date.now()) {
      throw AppError.unauthorized('Refresh token is no longer valid');
    }

    if (storedToken.userId !== payload.sub) {
      throw AppError.unauthorized('Refresh token does not match user');
    }

    const tokens = await this.generateTokens(storedToken.user, { userAgent, ipAddress });
    await this.repository.revokeRefreshToken(storedToken.id);

    return {
      user: this.mapToAuthUser(storedToken.user),
      tokens
    };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    const tokenHash = hashToken(refreshToken);
    const storedToken = await this.repository.findRefreshTokenByHash(tokenHash);
    if (storedToken && !storedToken.revokedAt) {
      await this.repository.revokeRefreshToken(storedToken.id);
    }
  }

  async logoutAll(userId: string) {
    await this.repository.revokeRefreshTokensByUser(userId);
  }

  private async generateTokens(user: User & { roles: { role: Role }[] }) {
    const roles = user.roles.map((role) => role.role);
    const tokenId = generateId();

    const accessToken = signAccessToken({
      sub: user.id,
      roles,
      email: user.email
    });

    const refreshToken = signRefreshToken({
      sub: user.id,
      roles,
      email: user.email,
      tokenId
    });

    const expiresAt = new Date(Date.now() + refreshTokenTtlMs);

    await this.repository.createRefreshToken({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: expiresAt
    } satisfies AuthTokens;
  }

  private mapToAuthUser(user: User & { roles: { role: Role }[]; employee: { status: EmploymentStatus } | null }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map((role) => role.role),
      status: user.employee?.status ?? null
    } satisfies AuthUser;
  }
}

