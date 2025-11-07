import { logger } from '@config';
import { AppError } from '@core/errors';
import { createErrorResponse } from '@core/http/response';
import type { NextFunction, Request, Response } from 'express';

export const errorHandler = (error: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof AppError) {
    if (!error.isOperational) {
      logger.error({ err: error, path: req.path }, 'Non-operational error');
    }
    return res.status(error.statusCode).json(createErrorResponse(error.message, error.code, error.details));
  }

  logger.error({ err: error, path: req.path }, 'Unhandled error');
  return res.status(500).json(createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR'));
};

