import pino, { Logger } from 'pino';

import { env } from './env';

const transport = !env.isProduction
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  : undefined;

export const logger: Logger = pino({
  level: env.LOG_LEVEL,
  transport
});

