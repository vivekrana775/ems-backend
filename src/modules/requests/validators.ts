import { RequestStatus, RequestType } from '@prisma/client';
import { z } from 'zod';

export const createRequestSchema = {
  body: z.object({
    type: z.nativeEnum(RequestType),
    title: z.string().min(3),
    description: z.string().optional(),
    priority: z.number().min(1).max(5).optional(),
    employeeId: z.string().uuid().optional()
  })
};

export const updateRequestStatusSchema = {
  body: z.object({
    status: z.nativeEnum(RequestStatus)
  })
};

export const listRequestsSchema = {
  query: z.object({
    employeeId: z.string().uuid().optional(),
    status: z.nativeEnum(RequestStatus).optional(),
    type: z.nativeEnum(RequestType).optional(),
    page: z.coerce.number().min(1).optional(),
    pageSize: z.coerce.number().min(1).max(100).optional()
  })
};

