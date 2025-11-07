export type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ErrorResponse = {
  success: false;
  message: string;
  code: string;
  details?: unknown;
};

export const createSuccessResponse = <T>(data: T, message?: string): SuccessResponse<T> => ({
  success: true,
  data,
  message
});

export const createErrorResponse = (message: string, code: string, details?: unknown): ErrorResponse => ({
  success: false,
  message,
  code,
  details
});

