import { EmploymentStatus, Role } from '@prisma/client';
import { z } from 'zod';

const employeePayload = z
  .object({
    employeeCode: z.string().min(1),
    department: z.string().optional().nullable(),
    jobTitle: z.string().optional().nullable(),
    status: z.nativeEnum(EmploymentStatus).optional(),
    managerId: z.string().uuid().optional().nullable(),
    hireDate: z.coerce.date().optional().nullable(),
    phone: z.string().optional().nullable(),
    location: z.string().optional().nullable()
  })
  .optional();

export const signupSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    roles: z.array(z.nativeEnum(Role)).optional(),
    employee: employeePayload
  })
};

export const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1).optional()
  })
};

export const logoutSchema = refreshSchema;

