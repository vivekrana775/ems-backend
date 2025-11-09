import 'module-alias/register';
import { env, logger } from '@config/index';
import { app } from './app';
import path from 'path';

if (process.env.NODE_ENV === 'development') {
  require('module-alias').addAliases({
    '@config': path.join(__dirname, '../src/config'),
    '@core': path.join(__dirname, '../src/core'),
    '@modules': path.join(__dirname, '../src/modules'),
    '@middlewares': path.join(__dirname, '../src/middlewares'),
    '@routes': path.join(__dirname, '../src/routes'),
    '@utils': path.join(__dirname, '../src/utils'),
    '@types': path.join(__dirname, '../src/types'),
    '@lib': path.join(__dirname, '../src/lib')
  });
}

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
});

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  shutdown('uncaughtException');
});

