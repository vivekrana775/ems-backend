import { prisma } from '@lib/prisma';
import type { Prisma } from '@prisma/client';


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
  }
} satisfies Prisma.TimeEntryInclude;

export type TimeEntryWithEmployee = Prisma.TimeEntryGetPayload<{
  include: typeof include;
}>;

export type ListTimeEntriesFilters = {
  employeeId?: string;
  startDate?: Date;
  endDate?: Date;
  skip: number;
  take: number;
  userId?: string;
};

export class TimeRepository {
  create(data: Prisma.TimeEntryCreateInput) {
    return prisma.timeEntry.create({ data, include });
  }

  update(id: string, data: Prisma.TimeEntryUpdateInput) {
    return prisma.timeEntry.update({ where: { id }, data, include });
  }

  findOpenEntry(employeeId: string) {
    return prisma.timeEntry.findFirst({
      where: {
        employeeId,
        clockOutAt: null
      },
      orderBy: { clockInAt: 'desc' },
      include
    });
  }

  list({ employeeId, startDate, endDate, skip, take }: ListTimeEntriesFilters) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) {
      dateFilter.gte = startDate;
    }
    if (endDate) {
      dateFilter.lte = endDate;
    }

    return prisma.timeEntry.findMany({
      where: {
        employeeId,
        clockInAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
      },
      orderBy: { clockInAt: 'desc' },
      include,
      skip,
      take
    });
  }

  count({ employeeId, startDate, endDate }: Omit<ListTimeEntriesFilters, 'skip' | 'take'>) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) {
      dateFilter.gte = startDate;
    }
    if (endDate) {
      dateFilter.lte = endDate;
    }

    return prisma.timeEntry.count({
      where: {
        employeeId,
        clockInAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
      }
    });
  }
}

