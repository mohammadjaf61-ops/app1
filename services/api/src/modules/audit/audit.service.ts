import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

export interface CreateAuditLogDto {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async log(dto: CreateAuditLogDto) {
    try {
      const auditLog = await this.prisma.auditLog.create({
        data: {
          userId: dto.userId,
          action: dto.action,
          entity: dto.entity,
          entityId: dto.entityId,
          oldData: dto.oldData,
          newData: dto.newData,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
        },
      });

      const entityInfo = dto.entityId ? `:${dto.entityId}` : '';
      this.logger.log(`Audit: ${dto.action} on ${dto.entity}${entityInfo} by user ${dto.userId}`);

      return auditLog;
    } catch (error) {
      // Don't throw - audit logging should not break the main flow
      this.logger.error(`Failed to create audit log: ${error}`);
      return null;
    }
  }

  /**
   * Get all audit logs with filters
   */
  async findAll(params: {
    userId?: string;
    action?: string;
    entity?: string;
    entityId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    const { userId, action, entity, entityId, dateFrom, dateTo, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: {
      userId?: string;
      action?: string;
      entity?: string;
      entityId?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

    if (userId) {
      where.userId = userId;
    }
    if (action) {
      where.action = action;
    }
    if (entity) {
      where.entity = entity;
    }
    if (entityId) {
      where.entityId = entityId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, fullName: true, role: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + logs.length < total,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Get audit log by ID
   */
  async findById(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });
  }

  /**
   * Get audit logs for a specific entity
   */
  async findByEntity(entity: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });
  }

  /**
   * Get recent activity for a user
   */
  async getUserActivity(userId: string, limit = 20) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get audit statistics
   */
  async getStatistics(params: { dateFrom?: Date; dateTo?: Date }) {
    const { dateFrom, dateTo } = params;

    const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    // Get counts by action
    const actionCounts = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true },
    });

    // Get counts by entity
    const entityCounts = await this.prisma.auditLog.groupBy({
      by: ['entity'],
      where,
      _count: { entity: true },
    });

    // Get counts by user
    const userCounts = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    });

    // Get user names for top users
    const userIds = userCounts.map((u: { userId: string }) => u.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true },
    });

    const userMap = new Map(users.map((u: { id: string; fullName: string }) => [u.id, u.fullName]));

    return {
      byAction: actionCounts.map((a: { action: string; _count: { action: number } }) => ({
        action: a.action,
        count: a._count.action,
      })),
      byEntity: entityCounts.map((e: { entity: string; _count: { entity: number } }) => ({
        entity: e.entity,
        count: e._count.entity,
      })),
      topUsers: userCounts.map((u: { userId: string; _count: { userId: number } }) => ({
        userId: u.userId,
        userName: userMap.get(u.userId) || 'Unknown',
        count: u._count.userId,
      })),
    };
  }
}
