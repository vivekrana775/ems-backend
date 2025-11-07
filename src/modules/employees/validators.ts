import { EmploymentStatus, Role } from '@prisma/client';
import { z } from 'zod';

export const listEmployeesSchema = {
  query: z.object({
    status: z.nativeEnum(EmploymentStatus).optional(),
    department: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().min(1).optional(),
    pageSize: z.coerce.number().min(1).max(100).optional()
  })
};

export const createEmployeeSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    employeeCode: z.string().min(1),
    department: z.string().optional().nullable(),
    jobTitle: z.string().optional().nullable(),
    status: z.nativeEnum(EmploymentStatus).optional(),
    managerId: z.string().uuid().optional().nullable(),
    hireDate: z.coerce.date().optional().nullable(),
    phone: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    roles: z.array(z.nativeEnum(Role)).optional()
  })
};

export const updateEmployeeSchema = {
  body: z.object({
    department: z.string().optional().nullable(),
    jobTitle: z.string().optional().nullable(),
    managerId: z.string().uuid().optional().nullable(),
    hireDate: z.coerce.date().optional().nullable(),
    phone: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    status: z.nativeEnum(EmploymentStatus).optional(),
    roles: z.array(z.nativeEnum(Role)).optional()
  })
};

export const updateStatusSchema = {
  body: z.object({
    status: z.nativeEnum(EmploymentStatus),
    isActive: z.boolean()
  })
};

