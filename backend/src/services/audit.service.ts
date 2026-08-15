import { prisma } from '../database/client';
import { logger } from '../config/logger';

export class AuditService {
  public static async log({
    userId,
    action,
    target,
    ipAddress,
    userAgent,
    metadata,
  }: {
    userId?: string;
    action: string;
    target?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          target,
          ipAddress,
          userAgent,
          metadata: metadata || undefined,
        },
      });
    } catch (error: any) {
      logger.error(`Failed to record audit log: ${error.message}`);
    }
  }

  public static async getLogs(query: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
