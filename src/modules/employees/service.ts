
import { AppError } from '@core/errors';
import { AuthService } from '@modules/auth/service';
import { EmploymentStatus, Role } from '@prisma/client';

import { EmployeeRepository, type EmployeeWithRelations, type ListEmployeesFilters } from './repository';

export type CreateEmployeeInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  department?: string | null;
  jobTitle?: string | null;
  status?: EmploymentStatus;
  managerId?: string | null;
  hireDate?: Date | null;
  phone?: string | null;
  location?: string | null;
  roles?: Role[];
};

export type UpdateEmployeeInput = {
  department?: string | null;
  jobTitle?: string | null;
  managerId?: string | null;
  hireDate?: Date | null;
  phone?: string | null;
  location?: string | null;
  status?: EmploymentStatus;
  roles?: Role[];
};

type ListFilters = Omit<ListEmployeesFilters, 'skip' | 'take'> & {
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 20;

export class EmployeeService {
  constructor(
    private readonly repository = new EmployeeRepository(),
    private readonly authService = new AuthService()
  ) {}

  async list(filters: ListFilters) {
    const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
    const page = filters.page ?? 1;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.repository.list({
        status: filters.status,
        department: filters.department,
        search: filters.search,
        skip,
        take: pageSize
      }),
      this.repository.count({ status: filters.status, department: filters.department, search: filters.search })
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  getById(id: string): Promise<EmployeeWithRelations | null> {
    return this.repository.findById(id);
  }

  async create(input: CreateEmployeeInput) {
    if (input.managerId) {
      const manager = await this.repository.findById(input.managerId);
      if (!manager) {
        throw AppError.badRequest('Manager not found');
      }
    }

    const existingCode = await this.repository.findByEmployeeCode(input.employeeCode);
    if (existingCode) {
      throw AppError.badRequest('Employee code already in use');
    }

    const authUser = await this.authService.register({
      email: input.email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      roles: input.roles ?? [Role.EMPLOYEE],
      employee: {
        employeeCode: input.employeeCode,
        department: input.department,
        jobTitle: input.jobTitle,
        status: input.status ?? EmploymentStatus.ACTIVE,
        managerId: input.managerId ?? undefined,
        hireDate: input.hireDate ?? undefined,
        phone: input.phone ?? undefined,
        location: input.location ?? undefined
      }
    });

    const employee = await this.repository.findByUserId(authUser.id);
    if (!employee) {
      throw new Error('Failed to load created employee');
    }

    return employee;
  }

  async update(id: string, input: UpdateEmployeeInput) {
    const employee = await this.repository.findById(id);
    if (!employee) {
      throw AppError.notFound('Employee not found');
    }

    if (input.managerId) {
      const manager = await this.repository.findById(input.managerId);
      if (!manager) {
        throw AppError.badRequest('Manager not found');
      }
    }

    const updatedEmployee = await this.repository.update(id, {
      department: input.department,
      jobTitle: input.jobTitle,
      manager:
        input.managerId === undefined
          ? undefined
          : input.managerId
            ? { connect: { id: input.managerId } }
            : { disconnect: true },
      hireDate: input.hireDate ?? undefined,
      phone: input.phone,
      location: input.location,
      status: input.status
    });

    if (input.roles && input.roles.length > 0) {
      await this.repository.updateUserRoles(employee.userId, input.roles);
    }

    return updatedEmployee;
  }

  async updateStatus(id: string, status: EmploymentStatus, isActive: boolean) {
    const employee = await this.repository.findById(id);
    if (!employee) {
      throw AppError.notFound('Employee not found');
    }

    const updated = await this.repository.update(id, { status });
    await this.repository.setUserActive(employee.userId, isActive);
    return updated;
  }
}

