import { AppError } from '@core/errors';
import { EmploymentStatus, Role } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';


import { TimeService } from '../service';

const baseEmployee = {
  id: 'emp-1',
  employeeCode: 'EMP-1',
  status: EmploymentStatus.ACTIVE,
  user: {
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'User',
    lastName: 'Example',
    roles: [{ role: Role.EMPLOYEE }]
  }
};

describe('TimeService', () => {
  it('prevents multiple open clock-ins', async () => {
    const timeRepository = {
      findOpenEntry: vi.fn().mockResolvedValue({ id: 'entry-1', clockInAt: new Date() })
    };
    const employeeRepository = {
      findByUserId: vi.fn().mockResolvedValue(baseEmployee),
      findById: vi.fn()
    };

    const service = new TimeService(timeRepository as any, employeeRepository as any);

    await expect(
      service.clockIn({ userId: 'user-1', roles: [Role.EMPLOYEE], note: undefined })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('creates a time entry on clock-in', async () => {
    const now = new Date();
    const timeRepository = {
      findOpenEntry: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'entry-2',
        employeeId: baseEmployee.id,
        clockInAt: now,
        clockOutAt: null,
        note: null,
        createdAt: now,
        updatedAt: now,
        employee: {
          id: baseEmployee.id,
          employeeCode: baseEmployee.employeeCode,
          user: baseEmployee.user
        }
      })
    };
    const employeeRepository = {
      findByUserId: vi.fn().mockResolvedValue(baseEmployee),
      findById: vi.fn()
    };

    const service = new TimeService(timeRepository as any, employeeRepository as any);

    const entry = await service.clockIn({ userId: 'user-1', roles: [Role.EMPLOYEE] });

    expect(entry.id).toBe('entry-2');
    expect(timeRepository.create).toHaveBeenCalled();
  });
});

