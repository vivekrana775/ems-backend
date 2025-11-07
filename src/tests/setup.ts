import { beforeAll, vi } from 'vitest';

vi.mock('@lib/prisma', () => {
  const prismaMock = {
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined)
  };

  return { prisma: prismaMock };
});

beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

