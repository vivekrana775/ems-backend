import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  const tsconfigPaths = (await import('vite-tsconfig-paths')).default;

  return {
    plugins: [tsconfigPaths()],
    resolve: {
      alias: {
        '@config': path.resolve(__dirname, 'src/config'),
        '@core': path.resolve(__dirname, 'src/core'),
        '@modules': path.resolve(__dirname, 'src/modules'),
        '@middlewares': path.resolve(__dirname, 'src/middlewares'),
        '@routes': path.resolve(__dirname, 'src/routes'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@types': path.resolve(__dirname, 'src/types'),
        '@lib': path.resolve(__dirname, 'src/lib')
      }
    },
    test: {
      globals: true,
      environment: 'node',
      setupFiles: ['./src/tests/setup.ts'],
      coverage: {
        reporter: ['text', 'lcov'],
        include: ['src/**/*.ts'],
        exclude: [
          'src/index.ts',
          'src/app.ts',
          'src/tests/**',
          'src/modules/shared/seed.ts',
          '**/*.d.ts'
        ]
      }
    }
  };
});

