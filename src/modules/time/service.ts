
import { AppError } from '@core/errors';
import { EmployeeRepository } from '@modules/employees/repository';
import { Role } from '@prisma/client';

import { TimeRepository, type TimeEntryWithEmployee } from './repository';

type ClockActionInput = {
  userId: string;
  roles: Role[];
  employeeId?: string;
  note?: string;
};

type ListInput = {
  userId: string;
  roles: Role[];
  employeeId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 20;

const canManageOthers = (roles: Role[]) =>
  roles.includes(Role.ADMIN) || roles.includes(Role.MANAGER) || roles.includes(Role.HR);

const sanitizeTimeEntry = (entry: TimeEntryWithEmployee) => ({
  id: entry.id,
  employeeId: entry.employeeId,
  clockInAt: entry.clockInAt,
  clockOutAt: entry.clockOutAt,
  note: entry.note,
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt,
  employee: {
    id: entry.employee.id,
    employeeCode: entry.employee.employeeCode,
    user: entry.employee.user
  }
});

export class TimeService {
  constructor(
    private readonly repository = new TimeRepository(),
    private readonly employeeRepository = new EmployeeRepository()
  ) {}

  async clockIn({ userId, roles, employeeId, note }: ClockActionInput) {
    const targetEmployee = await this.resolveEmployee(userId, roles, employeeId);

    const existing = await this.repository.findOpenEntry(targetEmployee.id);
    if (existing) {
      throw AppError.badRequest('Employee already clocked in');
    }

    const entry = await this.repository.create({
      employee: { connect: { id: targetEmployee.id } },
      clockInAt: new Date(),
      note,
      createdBy: { connect: { id: userId } }
    });

    return sanitizeTimeEntry(entry);
  }

  async clockOut({ userId, roles, employeeId, note }: ClockActionInput) {
    const targetEmployee = await this.resolveEmployee(userId, roles, employeeId);

    const existing = await this.repository.findOpenEntry(targetEmployee.id);
    if (!existing) {
      throw AppError.badRequest('No active time entry found');
    }

    const now = new Date();
    if (now <= existing.clockInAt) {
      throw AppError.badRequest('Clock-out time must be after clock-in time');
    }

    const entry = await this.repository.update(existing.id, {
      clockOutAt: now,
      note
    });

    return sanitizeTimeEntry(entry);
  }

  async list({ userId, roles, employeeId, startDate, endDate, page, pageSize }: ListInput) {
    const targetEmployee = await this.resolveEmployeeForListing(userId, roles, employeeId);
    const effectiveEmployeeId = targetEmployee?.id ?? employeeId;

    const take = pageSize ?? DEFAULT_PAGE_SIZE;
    const currentPage = page ?? 1;
    const skip = (currentPage - 1) * take;

    const [entries, total] = await Promise.all([
      this.repository.list({
        employeeId: effectiveEmployeeId,
        startDate,
        endDate,
        skip,
        take
      }),
      this.repository.count({
        employeeId: effectiveEmployeeId,
        startDate,
        endDate
      })
    ]);

    return {
      data: entries.map(sanitizeTimeEntry),
      meta: {
        total,
        page: currentPage,
        pageSize: take,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  private async resolveEmployee(userId: string, roles: Role[], employeeId?: string) {
    if (employeeId) {
      if (!canManageOthers(roles)) {
        throw AppError.forbidden('You do not have permission to manage other employees');
      }
      const employee = await this.employeeRepository.findById(employeeId);
      if (!employee) {
        throw AppError.notFound('Employee not found');
      }
      return employee;
    }

    const employee = await this.employeeRepository.findByUserId(userId);
    if (!employee) {
      throw AppError.badRequest('Employee profile not found');
    }
    return employee;
  }

  private async resolveEmployeeForListing(userId: string, roles: Role[], employeeId?: string) {
    if (employeeId) {
      if (!canManageOthers(roles)) {
        throw AppError.forbidden('You do not have permission to view other employees');
      }
      const employee = await this.employeeRepository.findById(employeeId);
      if (!employee) {
        throw AppError.notFound('Employee not found');
      }
      return employee;
    }

    const employee = await this.employeeRepository.findByUserId(userId);
    if (!employee && !canManageOthers(roles)) {
      throw AppError.badRequest('Employee profile not found');
    }
    return employee;
  }
}

