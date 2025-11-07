import { env, logger } from '@config';
import { PrismaClient } from '@prisma/client';

declare global {
   
  var __prismaClient: PrismaClient | undefined;
}

const createClient = () =>
  new PrismaClient({
    log: env.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['warn', 'error']
  });

export const prisma: PrismaClient = global.__prismaClient ?? createClient();

if (!env.isProduction) {
  global.__prismaClient = prisma;
}

prisma
  .$connect()
  .then(() => logger.info('Prisma connected to database'))
  .catch((error) => {
    logger.error({ err: error }, 'Failed to connect Prisma');
    process.exit(1);
  });

