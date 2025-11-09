import { env } from '@config/index';
import bcrypt from 'bcrypt';

const saltRounds = env.BCRYPT_SALT_ROUNDS;

export const hashPassword = async (plain: string): Promise<string> => {
  return bcrypt.hash(plain, saltRounds);
};

export const comparePassword = async (plain: string, hashed: string): Promise<boolean> => {
  return bcrypt.compare(plain, hashed);
};

