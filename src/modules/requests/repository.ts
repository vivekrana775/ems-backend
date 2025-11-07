import { prisma } from '@lib/prisma';
import type { Prisma, RequestStatus, RequestType } from '@prisma/client';


const include = {
  employee: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  },
  approver: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true
    }
  }
} satisfies Prisma.RequestInclude;

export type RequestWithRelations = Prisma.RequestGetPayload<{
  include: typeof include;
}>;

export type RequestFilters = {
  employeeId?: string;
  approverId?: string;
  status?: RequestStatus;
  type?: RequestType;
  skip: number;
  take: number;
};

export class RequestRepository {
  create(data: Prisma.RequestCreateInput) {
    return prisma.request.create({ data, include });
  }

  update(id: string, data: Prisma.RequestUpdateInput) {
    return prisma.request.update({ where: { id }, data, include });
  }

  findById(id: string) {
    return prisma.request.findUnique({ where: { id }, include });
  }

  list({ employeeId, approverId, status, type, skip, take }: RequestFilters) {
    return prisma.request.findMany({
      where: {
        employeeId,
        approverId,
        status,
        type
      },
      orderBy: { createdAt: 'desc' },
      include,
      skip,
      take
    });
  }

  count(filters: Omit<RequestFilters, 'skip' | 'take'>) {
    return prisma.request.count({
      where: {
        employeeId: filters.employeeId,
        approverId: filters.approverId,
        status: filters.status,
        type: filters.type
      }
    });
  }
}

