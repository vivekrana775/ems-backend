import { z } from 'zod';

export const clockInSchema = {
  body: z.object({
    employeeId: z.string().uuid().optional(),
    note: z.string().max(255).optional()
  })
};

export const clockOutSchema = {
  body: z.object({
    employeeId: z.string().uuid().optional(),
    note: z.string().max(255).optional()
  })
};

export const listEntriesSchema = {
  query: z.object({
    employeeId: z.string().uuid().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    page: z.coerce.number().min(1).optional(),
    pageSize: z.coerce.number().min(1).max(100).optional()
  })
};

