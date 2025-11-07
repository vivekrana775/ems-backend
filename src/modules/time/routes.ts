
import { authenticate } from '@middlewares/auth';
import { validate } from '@middlewares/validate';
import { Router } from 'express';

import { TimeController } from './controller';
import { clockInSchema, clockOutSchema, listEntriesSchema } from './validators';

const controller = new TimeController();

export const timeRouter = Router();

timeRouter.use(authenticate);

timeRouter.post('/clock-in', validate(clockInSchema), controller.clockIn);
timeRouter.post('/clock-out', validate(clockOutSchema), controller.clockOut);
timeRouter.get('/entries', validate(listEntriesSchema), controller.list);

