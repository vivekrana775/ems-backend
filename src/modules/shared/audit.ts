import { prisma } from '@lib/prisma';

type AuditLogInput = {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: any;
};

export const createAuditLog = (input: AuditLogInput) => {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata
    }
  });
};

