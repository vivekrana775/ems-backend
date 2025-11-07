import crypto from 'node:crypto';

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateId = (): string => crypto.randomUUID();

