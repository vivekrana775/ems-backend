import { createSuccessResponse } from '@core/http/response';
import { Role } from '@prisma/client';
import type { Request, Response } from 'express';


import { TimeService } from './service';

export class TimeController {
  constructor(private readonly service = new TimeService()) {}

  clockIn = async (req: Request, res: Response) => {
    const entry = await this.service.clockIn({
      userId: req.user!.id,
      roles: req.user!.roles as Role[],
      employeeId: req.body.employeeId,
      note: req.body.note
    });

    return res.status(201).json(createSuccessResponse(entry, 'Clock-in recorded'));
  };

  clockOut = async (req: Request, res: Response) => {
    const entry = await this.service.clockOut({
      userId: req.user!.id,
      roles: req.user!.roles as Role[],
      employeeId: req.body.employeeId,
      note: req.body.note
    });

    return res.json(createSuccessResponse(entry, 'Clock-out recorded'));
  };

  list = async (req: Request, res: Response) => {
    const result = await this.service.list({
      userId: req.user!.id,
      roles: req.user!.roles as Role[],
      employeeId: req.query.employeeId as string | undefined,
      startDate: req.query.startDate as Date | undefined,
      endDate: req.query.endDate as Date | undefined,
      page: req.query.page as number | undefined,
      pageSize: req.query.pageSize as number | undefined
    });

    return res.json(createSuccessResponse(result, 'Time entries fetched'));
  };
}

