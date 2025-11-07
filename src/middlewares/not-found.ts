import { createErrorResponse } from '@core/http/response';
import type { Request, Response } from 'express';

export const notFoundHandler = (req: Request, res: Response) => {
  return res.status(404).json(createErrorResponse('Route not found', 'NOT_FOUND'));
};

