import { prisma } from '@lib/prisma';
import type { EmploymentStatus, Prisma, Role } from '@prisma/client';


const baseEmployeeInclude = {
  user: {
    include: {
      roles: true
    }
  },
  manager: {
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  }
} satisfies Prisma.EmployeeInclude;

export type EmployeeInclude = typeof baseEmployeeInclude;

export type EmployeeWithRelations = Prisma.EmployeeGetPayload<{
  include: EmployeeInclude;
}>;

export type ListEmployeesFilters = {
  status?: EmploymentStatus;
  department?: string;
  search?: string;
  skip: number;
  take: number;
};

export class EmployeeRepository {
  list({ status, department, search, skip, take }: ListEmployeesFilters) {
    return prisma.employee.findMany({
      where: {
        status,
        department: department ? { equals: department, mode: 'insensitive' } : undefined,
        OR: search
          ? [
              { user: { firstName: { contains: search, mode: 'insensitive' } } },
              { user: { lastName: { contains: search, mode: 'insensitive' } } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
              { employeeCode: { contains: search, mode: 'insensitive' } }
            ]
          : undefined
      },
      include: baseEmployeeInclude,
      skip,
      take,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  count({ status, department, search }: Omit<ListEmployeesFilters, 'skip' | 'take'>) {
    return prisma.employee.count({
      where: {
        status,
        department: department ? { equals: department, mode: 'insensitive' } : undefined,
        OR: search
          ? [
              { user: { firstName: { contains: search, mode: 'insensitive' } } },
              { user: { lastName: { contains: search, mode: 'insensitive' } } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
              { employeeCode: { contains: search, mode: 'insensitive' } }
            ]
          : undefined
      }
    });
  }

  findById(id: string) {
    return prisma.employee.findUnique({
      where: { id },
      include: baseEmployeeInclude
    });
  }

  findByEmployeeCode(employeeCode: string) {
    return prisma.employee.findUnique({
      where: { employeeCode },
      include: baseEmployeeInclude
    });
  }

  findByUserId(userId: string) {
    return prisma.employee.findUnique({
      where: { userId },
      include: baseEmployeeInclude
    });
  }

  create(data: Prisma.EmployeeCreateInput) {
    return prisma.employee.create({
      data,
      include: baseEmployeeInclude
    });
  }

  update(id: string, data: Prisma.EmployeeUpdateInput) {
    return prisma.employee.update({
      where: { id },
      data,
      include: baseEmployeeInclude
    });
  }

  updateUserRoles(userId: string, roles: Role[]) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          deleteMany: {},
          create: roles.map((role) => ({ role }))
        }
      },
      include: {
        roles: true
      }
    });
  }

  setUserActive(userId: string, isActive: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { isActive }
    });
  }
}

