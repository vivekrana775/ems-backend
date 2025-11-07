
import { authRouter } from '@modules/auth/routes';
import { employeeRouter } from '@modules/employees/routes';
import { requestRouter } from '@modules/requests/routes';
import { timeRouter } from '@modules/time/routes';
import { Router } from 'express';
import type { Express } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRouter);
router.use('/employees', employeeRouter);
router.use('/time', timeRouter);
router.use('/requests', requestRouter);

export const registerRoutes = (app: Express) => {
  app.use('/api', router);
};

