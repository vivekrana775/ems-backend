import { prisma } from '@lib/prisma';
import type { EmploymentStatus, Prisma, Role } from '@prisma/client';


const userInclude = {
  roles: true,
  employee: true
} satisfies Prisma.UserInclude;

export type CreateUserInput = {
  email: string;
  passwordHash: string;
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

export type CreateRefreshTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  replacedByToken?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
};

export class AuthRepository {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: userInclude
    });
  }

  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: userInclude
    });
  }

  async createUser(input: CreateUserInput) {
    return prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        roles: {
          create: input.roles.map((role) => ({ role }))
        },
        employee: input.employee ? { create: input.employee } : undefined
      },
      include: userInclude
    });
  }

  async recordLogin(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });
  }

  async createRefreshToken(input: CreateRefreshTokenInput) {
    return prisma.refreshToken.create({
      data: {
        userId: input.userId,
        token: input.tokenHash,
        expiresAt: input.expiresAt,
        replacedByToken: input.replacedByToken,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress
      }
    });
  }

  async findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { token: tokenHash },
      include: {
        user: {
          include: userInclude
        }
      }
    });
  }

  async revokeRefreshToken(id: string) {
    await prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() }
    });
  }

  async revokeRefreshTokensByUser(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
}


