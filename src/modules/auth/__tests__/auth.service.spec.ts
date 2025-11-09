import { AppError } from '../../../core/errors';
import { EmploymentStatus, Role } from '@prisma/client';
import * as utils from '../../../utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../service';

const baseUser = {
  id: 'user-1',
  email: 'jane.doe@example.com',
  passwordHash: 'stored-hash',
  firstName: 'Jane',
  lastName: 'Doe',
  isActive: true,
  roles: [{ role: Role.EMPLOYEE }],
  employee: { status: EmploymentStatus.ACTIVE }
};

const createRepository = () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
  recordLogin: vi.fn(),
  createRefreshToken: vi.fn()
});

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs a user in with valid credentials', async () => {
    const repository = createRepository();
    repository.findUserByEmail.mockResolvedValue(baseUser);
    vi.spyOn(utils, 'comparePassword').mockResolvedValue(true);
    vi.spyOn(utils, 'hashToken').mockReturnValue('token-hash');

    const service = new AuthService(repository as any);
    const result = await service.login({ email: baseUser.email, password: 'password' });

    expect(result.user).toMatchObject({ id: baseUser.id, email: baseUser.email });
    expect(repository.recordLogin).toHaveBeenCalledWith(baseUser.id);
    expect(repository.createRefreshToken).toHaveBeenCalledWith(expect.objectContaining({ userId: baseUser.id }));
  });

  it('throws when credentials are invalid', async () => {
    const repository = createRepository();
    repository.findUserByEmail.mockResolvedValue(baseUser);
    vi.spyOn(utils, 'comparePassword').mockResolvedValue(false);

    const service = new AuthService(repository as any);

    await expect(service.login({ email: baseUser.email, password: 'wrong' })).rejects.toBeInstanceOf(AppError);
  });
});

