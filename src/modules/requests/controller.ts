import { createSuccessResponse } from '@core/http/response';
import { RequestStatus, RequestType, Role } from '@prisma/client';
import type { Request, Response } from 'express';


import { RequestService } from './service';

export class RequestController {
  constructor(private readonly service = new RequestService()) {}

  create = async (req: Request, res: Response) => {
    const request = await this.service.create(req.user!.id, req.user!.roles as Role[], req.body);
    return res.status(201).json(createSuccessResponse(request, 'Request submitted'));
  };

  list = async (req: Request, res: Response) => {
    const result = await this.service.list({
      userId: req.user!.id,
      roles: req.user!.roles as Role[],
      employeeId: req.query.employeeId as string | undefined,
      status: req.query.status as RequestStatus | undefined,
      type: req.query.type as RequestType | undefined,
      page: req.query.page as number | undefined,
      pageSize: req.query.pageSize as number | undefined
    });

    return res.json(createSuccessResponse(result, 'Requests fetched'));
  };

  getById = async (req: Request, res: Response) => {
    const request = await this.service.getById(req.user!.id, req.user!.roles as Role[], req.params.id);
    return res.json(createSuccessResponse(request, 'Request fetched'));
  };

  updateStatus = async (req: Request, res: Response) => {
    const request = await this.service.updateStatus({
      requestId: req.params.id,
      status: req.body.status,
      userId: req.user!.id,
      roles: req.user!.roles as Role[]
    });

    return res.json(createSuccessResponse(request, 'Request status updated'));
  };
}

