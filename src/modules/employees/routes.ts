
import { authenticate, authorize } from '@middlewares/auth';
import { validate } from '@middlewares/validate';
import { Role } from '@prisma/client';
import { Router } from 'express';

import { EmployeeController } from './controller';
import {
  createEmployeeSchema,
  listEmployeesSchema,
  updateEmployeeSchema,
  updateStatusSchema
} from './validators';

const controller = new EmployeeController();

export const employeeRouter = Router();

employeeRouter.use(authenticate);

employeeRouter.get('/', authorize(Role.ADMIN, Role.HR, Role.MANAGER), validate(listEmployeesSchema), controller.list);
employeeRouter.get('/:id', authorize(Role.ADMIN, Role.HR, Role.MANAGER), controller.getById);
employeeRouter.post('/', authorize(Role.ADMIN, Role.HR), validate(createEmployeeSchema), controller.create);
employeeRouter.put('/:id', authorize(Role.ADMIN, Role.HR, Role.MANAGER), validate(updateEmployeeSchema), controller.update);
employeeRouter.patch('/:id/status', authorize(Role.ADMIN, Role.HR), validate(updateStatusSchema), controller.updateStatus);

