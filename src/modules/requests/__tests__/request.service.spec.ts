import { AppError } from '@core/errors';
import { RequestStatus, RequestType, Role } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';


import { RequestService } from '../service';

const baseRequest = {
  id: 'req-1',
  type: RequestType.LEAVE,
  status: RequestStatus.PENDING,
  title: 'Time off',
  description: 'Vacation',
  priority: 3,
  submittedAt: new Date(),
  respondedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  employee: {
    id: 'emp-1',
    employeeCode: 'EMP-1',
    user: {
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'User',
      lastName: 'Example'
    }
  },
  approver: null
};

describe('RequestService', () => {
  it('prevents unauthorized status updates', async () => {
    const requestRepository = {
      findById: vi.fn().mockResolvedValue(baseRequest)
    };
    const employeeRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn().mockResolvedValue({ id: 'emp-1' })
    };

    const service = new RequestService(requestRepository as any, employeeRepository as any);

    await expect(
      service.updateStatus({
        requestId: baseRequest.id,
        status: RequestStatus.APPROVED,
        userId: 'user-2',
        roles: [Role.EMPLOYEE]
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('validates status transitions', async () => {
    const requestRepository = {
      findById: vi.fn().mockResolvedValue({ ...baseRequest, status: RequestStatus.REJECTED })
    };
    const employeeRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn().mockResolvedValue({ id: 'emp-1' })
    };

    const service = new RequestService(requestRepository as any, employeeRepository as any);

    await expect(
      service.updateStatus({
        requestId: baseRequest.id,
        status: RequestStatus.APPROVED,
        userId: 'manager-1',
        roles: [Role.MANAGER]
      })
    ).rejects.toBeInstanceOf(AppError);
  });
});

