
import { authenticate, authorize } from '@middlewares/auth';
import { validate } from '@middlewares/validate';
import { Role } from '@prisma/client';
import { Router } from 'express';

import { AuthController } from './controller';
import { loginSchema, logoutSchema, refreshSchema, signupSchema } from './validators';

const controller = new AuthController();

export const authRouter = Router();

authRouter.post(
  '/signup',
  authenticate,
  authorize(Role.ADMIN, Role.HR),
  validate(signupSchema),
  controller.signup
);

authRouter.post('/login', validate(loginSchema), controller.login);
authRouter.post('/refresh', validate(refreshSchema), controller.refresh);
authRouter.post('/logout', validate(logoutSchema), controller.logout);
authRouter.post('/logout/all', authenticate, controller.logoutAll);
authRouter.post('/password/forgot', controller.requestPasswordReset);
authRouter.post('/password/reset', controller.resetPassword);

