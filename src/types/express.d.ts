 
import type { Role } from '@prisma/client';
import type { TokenPayload } from '@utils/jwt';

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      roles: Role[];
      tokenPayload: TokenPayload;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};

