import { createErrorResponse, createSuccessResponse } from '@core/http/response';
import { EmploymentStatus, Role } from '@prisma/client';
import type { Request, Response } from 'express';


import type { EmployeeWithRelations } from './repository';
import { EmployeeService } from './service';

const serializeEmployee = (employee: EmployeeWithRelations) => ({
  id: employee.id,
  employeeCode: employee.employeeCode,
  department: employee.department,
  jobTitle: employee.jobTitle,
  status: employee.status,
  hireDate: employee.hireDate,
  phone: employee.phone,
  location: employee.location,
  createdAt: employee.createdAt,
  updatedAt: employee.updatedAt,
  user: {
    id: employee.user.id,
    email: employee.user.email,
    firstName: employee.user.firstName,
    lastName: employee.user.lastName,
    roles: employee.user.roles.map((role) => role.role as Role),
    isActive: employee.user.isActive,
    lastLoginAt: employee.user.lastLoginAt
  },
  manager: employee.manager
    ? {
        id: employee.manager.id,
        employeeCode: employee.manager.employeeCode,
        user: {
          id: employee.manager.user.id,
          email: employee.manager.user.email,
          firstName: employee.manager.user.firstName,
          lastName: employee.manager.user.lastName
        }
      }
    : null
});

export class EmployeeController {
  constructor(private readonly service = new EmployeeService()) {}

  list = async (req: Request, res: Response) => {
    const result = await this.service.list({
      status: req.query.status as EmploymentStatus | undefined,
      department: req.query.department as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page as number | undefined,
      pageSize: req.query.pageSize as number | undefined
    });

    return res.json(
      createSuccessResponse(
        {
          data: result.data.map(serializeEmployee),
          meta: result.meta
        },
        'Employees fetched'
      )
    );
  };

  getById = async (req: Request, res: Response) => {
    const employee = await this.service.getById(req.params.id);
    if (!employee) {
      return res.status(404).json(createErrorResponse('Employee not found', 'NOT_FOUND'));
    }

    return res.json(createSuccessResponse(serializeEmployee(employee), 'Employee fetched'));
  };

  create = async (req: Request, res: Response) => {
    const employee = await this.service.create(req.body);
    return res.status(201).json(createSuccessResponse(serializeEmployee(employee), 'Employee created'));
  };

  update = async (req: Request, res: Response) => {
    const employee = await this.service.update(req.params.id, req.body);
    return res.json(createSuccessResponse(serializeEmployee(employee), 'Employee updated'));
  };

  updateStatus = async (req: Request, res: Response) => {
    const employee = await this.service.updateStatus(
      req.params.id,
      req.body.status as EmploymentStatus,
      req.body.isActive as boolean
    );
    return res.json(createSuccessResponse(serializeEmployee(employee), 'Employee status updated'));
  };
}

