
import { authenticate, authorize } from '@middlewares/auth';
import { validate } from '@middlewares/validate';
import { Role } from '@prisma/client';
import { Router } from 'express';

import { RequestController } from './controller';
import { createRequestSchema, listRequestsSchema, updateRequestStatusSchema } from './validators';

const controller = new RequestController();

export const requestRouter = Router();

requestRouter.use(authenticate);

requestRouter.post('/', validate(createRequestSchema), controller.create);
requestRouter.get('/', validate(listRequestsSchema), controller.list);
requestRouter.get('/:id', controller.getById);
requestRouter.patch(
  '/:id/status',
  authorize(Role.ADMIN, Role.MANAGER, Role.HR),
  validate(updateRequestStatusSchema),
  controller.updateStatus
);

