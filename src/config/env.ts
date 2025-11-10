import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
loadEnv({ path: envFile });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().min(1).optional(),
  JWT_REFRESH_SECRET: z.string().min(1).optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  CORS_ORIGIN: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SEED_ADMIN_EMAIL: z.email().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional()
});

type RawEnv = z.infer<typeof envSchema>;

const rawEnv = envSchema.parse(process.env) as RawEnv;

const resolveRequired = (name: string, value: string | undefined, fallback?: string) => {
  if (value) {
    return value;
  }
  if (rawEnv.NODE_ENV === 'test' && fallback) {
    return fallback;
  }
  throw new Error(`Missing required environment variable: ${name}`);
};

const resolvedEnv = {
  ...rawEnv,
  DATABASE_URL: resolveRequired('DATABASE_URL', rawEnv.DATABASE_URL, 'postgresql://postgres:postgres@localhost:5432/test_db'),
  JWT_ACCESS_SECRET: resolveRequired('JWT_ACCESS_SECRET', rawEnv.JWT_ACCESS_SECRET, 'test-access-secret'),
  JWT_REFRESH_SECRET: resolveRequired('JWT_REFRESH_SECRET', rawEnv.JWT_REFRESH_SECRET, 'test-refresh-secret')
};

export const env = {
  ...resolvedEnv,
  isProduction: resolvedEnv.NODE_ENV === 'production',
  isTest: resolvedEnv.NODE_ENV === 'test',
  isDevelopment: resolvedEnv.NODE_ENV === 'development'
} as const;

export type Env = typeof env;

