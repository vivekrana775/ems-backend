
import { AppError } from '@core/errors';
import { EmployeeRepository } from '@modules/employees/repository';
import { createAuditLog } from '@modules/shared/audit';
import { RequestStatus, RequestType, Role } from '@prisma/client';

import { RequestRepository, type RequestWithRelations } from './repository';

type CreateRequestInput = {
  type: RequestType;
  title: string;
  description?: string;
  priority?: number;
  employeeId?: string;
};

type ListInput = {
  userId: string;
  roles: Role[];
  employeeId?: string;
  status?: RequestStatus;
  type?: RequestType;
  page?: number;
  pageSize?: number;
};

type UpdateStatusInput = {
  requestId: string;
  status: RequestStatus;
  userId: string;
  roles: Role[];
};

const DEFAULT_PAGE_SIZE = 20;

const canManageRequests = (roles: Role[]) =>
  roles.includes(Role.ADMIN) || roles.includes(Role.MANAGER) || roles.includes(Role.HR);

const serializeRequest = (request: RequestWithRelations) => ({
  id: request.id,
  type: request.type,
  status: request.status,
  title: request.title,
  description: request.description,
  priority: request.priority,
  submittedAt: request.submittedAt,
  respondedAt: request.respondedAt,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
  employee: {
    id: request.employee.id,
    employeeCode: request.employee.employeeCode,
    user: request.employee.user
  },
  approver: request.approver
});

const isValidTransition = (current: RequestStatus, next: RequestStatus) => {
  if (current === next) return true;
  if (current === RequestStatus.PENDING) {
    return [RequestStatus.APPROVED, RequestStatus.REJECTED, RequestStatus.CANCELLED].includes(next);
  }
  if (current === RequestStatus.APPROVED) {
    return next === RequestStatus.CANCELLED;
  }
  return false;
};

export class RequestService {
  constructor(
    private readonly repository = new RequestRepository(),
    private readonly employeeRepository = new EmployeeRepository()
  ) {}

  async create(userId: string, roles: Role[], input: CreateRequestInput) {
    const employee = await this.resolveEmployee(userId, roles, input.employeeId);

    const request = await this.repository.create({
      type: input.type,
      title: input.title,
      description: input.description,
      priority: input.priority ?? 3,
      employee: { connect: { id: employee.id } }
    });

    await createAuditLog({
      userId,
      action: 'REQUEST_CREATED',
      entity: 'Request',
      entityId: request.id,
      metadata: {
        type: request.type,
        priority: request.priority
      }
    });

    return serializeRequest(request);
  }

  async list({ userId, roles, employeeId, status, type, page, pageSize }: ListInput) {
    const employee = await this.resolveEmployeeForListing(userId, roles, employeeId);
    const effectiveEmployeeId = employee?.id ?? employeeId;

    const take = pageSize ?? DEFAULT_PAGE_SIZE;
    const currentPage = page ?? 1;
    const skip = (currentPage - 1) * take;

    const [requests, total] = await Promise.all([
      this.repository.list({
        employeeId: effectiveEmployeeId,
        status,
        type,
        skip,
        take
      }),
      this.repository.count({
        employeeId: effectiveEmployeeId,
        status,
        type
      })
    ]);

    return {
      data: requests.map(serializeRequest),
      meta: {
        total,
        page: currentPage,
        pageSize: take,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  async getById(userId: string, roles: Role[], requestId: string) {
    const request = await this.repository.findById(requestId);
    if (!request) {
      throw AppError.notFound('Request not found');
    }

    if (!canManageRequests(roles) && request.employee.user.id !== userId) {
      throw AppError.forbidden('You cannot view this request');
    }

    return serializeRequest(request);
  }

  async updateStatus({ requestId, status, userId, roles }: UpdateStatusInput) {
    if (!canManageRequests(roles)) {
      throw AppError.forbidden('You cannot update requests');
    }

    const request = await this.repository.findById(requestId);
    if (!request) {
      throw AppError.notFound('Request not found');
    }

    if (!isValidTransition(request.status, status)) {
      throw AppError.badRequest('Invalid request status transition');
    }

    const updated = await this.repository.update(request.id, {
      status,
      respondedAt: new Date(),
      approver: { connect: { id: userId } }
    });

    await createAuditLog({
      userId,
      action: 'REQUEST_STATUS_UPDATED',
      entity: 'Request',
      entityId: updated.id,
      metadata: {
        from: request.status,
        to: status
      }
    });

    return serializeRequest(updated);
  }

  private async resolveEmployee(userId: string, roles: Role[], employeeId?: string) {
    if (employeeId) {
      if (!canManageRequests(roles)) {
        throw AppError.forbidden('You do not have permission to submit for other employees');
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
      if (!canManageRequests(roles)) {
        throw AppError.forbidden('You do not have permission to view this employee');
      }
      const employee = await this.employeeRepository.findById(employeeId);
      if (!employee) {
        throw AppError.notFound('Employee not found');
      }
      return employee;
    }

    const employee = await this.employeeRepository.findByUserId(userId);
    if (!employee && !canManageRequests(roles)) {
      throw AppError.badRequest('Employee profile not found');
    }
    return employee;
  }
}

