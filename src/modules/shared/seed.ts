
import { env, logger } from '@config/index';
import { prisma } from '@lib/prisma';
import { EmploymentStatus, Role } from '@prisma/client';
import { hashPassword } from '@utils/password';

const DEFAULT_ADMIN_EMAIL = 'admin@example.com';
const DEFAULT_ADMIN_PASSWORD = 'ChangeMe123!';

async function seed() {
  const email = env.SEED_ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL;
  const password = env.SEED_ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;

  const passwordHash = await hashPassword(password);

  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash
    },
    create: {
      email,
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      roles: {
        create: [{ role: Role.ADMIN }]
      },
      employee: {
        create: {
          employeeCode: 'EMP-ADMIN',
          department: 'Administration',
          jobTitle: 'System Administrator',
          status: EmploymentStatus.ACTIVE
        }
      }
    }
  });

  logger.info({ email: adminUser.email }, 'Seeded admin user');
}

seed()
  .catch((error) => {
    logger.error({ err: error }, 'Seed failed');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

