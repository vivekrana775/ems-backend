export type AppErrorParams = {
  message: string;
  statusCode?: number;
  code?: string;
  details?: unknown;
  cause?: Error;
  isOperational?: boolean;
};

export class AppError extends Error {
  public readonly statusCode: number;

  public readonly code: string;

  public readonly details?: unknown;

  public readonly isOperational: boolean;

  constructor({
    message,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    details,
    cause,
    isOperational = true
  }: AppErrorParams) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    if (cause) {
      this.cause = cause;
    }
    Error.captureStackTrace(this, this.constructor);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError({ message, statusCode: 401, code: 'UNAUTHORIZED' });
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError({ message, statusCode: 403, code: 'FORBIDDEN' });
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError({ message, statusCode: 404, code: 'NOT_FOUND' });
  }

  static badRequest(message = 'Bad request', details?: unknown): AppError {
    return new AppError({ message, statusCode: 400, code: 'BAD_REQUEST', details });
  }
}

