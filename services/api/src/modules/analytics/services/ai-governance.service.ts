import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';

interface AiOutputLogInput {
  outputType: string;
  modelName: string;
  modelVersion?: string;
  inputParams?: any;
  outputData: any;
  processingMs?: number;
}

@Injectable()
export class AiGovernanceService {
  private readonly logger = new Logger(AiGovernanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log all AI/ML outputs for audit trail
   * All AI outputs must be logged before being used
   */
  async logOutput(input: AiOutputLogInput): Promise<string> {
    const log = await this.prisma.aiOutputLog.create({
      data: {
        outputType: input.outputType,
        modelName: input.modelName,
        modelVersion: input.modelVersion,
        inputParams: input.inputParams || {},
        outputData: input.outputData,
        processingMs: input.processingMs,
      },
    });

    this.logger.debug(`AI output logged: ${input.outputType} from ${input.modelName}`);
    return log.id;
  }

  /**
   * Mark an AI output as approved by human
   */
  async approveOutput(outputId: string, approvedBy: string, feedback?: string): Promise<void> {
    await this.prisma.aiOutputLog.update({
      where: { id: outputId },
      data: {
        isApproved: true,
        approvedBy,
        approvedAt: new Date(),
        feedback,
      },
    });

    this.logger.log(`AI output ${outputId} approved by ${approvedBy}`);
  }

  /**
   * Mark an AI output as rejected
   */
  async rejectOutput(outputId: string, rejectedBy: string, feedback: string): Promise<void> {
    await this.prisma.aiOutputLog.update({
      where: { id: outputId },
      data: {
        isApproved: false,
        approvedBy: rejectedBy,
        approvedAt: new Date(),
        feedback,
      },
    });

    this.logger.log(`AI output ${outputId} rejected by ${rejectedBy}: ${feedback}`);
  }

  /**
   * Get AI output audit trail
   */
  async getAuditTrail(
    filters: {
      outputType?: string;
      modelName?: string;
      startDate?: Date;
      endDate?: Date;
      isApproved?: boolean;
    },
    limit: number = 100,
  ) {
    const where: any = {};

    if (filters.outputType) {
      where.outputType = filters.outputType;
    }
    if (filters.modelName) {
      where.modelName = filters.modelName;
    }
    if (filters.isApproved !== undefined) {
      where.isApproved = filters.isApproved;
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.aiOutputLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics(modelName: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const outputs = await this.prisma.aiOutputLog.findMany({
      where: {
        modelName,
        createdAt: { gte: startDate },
      },
      select: {
        isApproved: true,
        processingMs: true,
        createdAt: true,
      },
    });

    const total = outputs.length;
    const approved = outputs.filter(
      (o: { isApproved: boolean | null }) => o.isApproved === true,
    ).length;
    const rejected = outputs.filter(
      (o: { isApproved: boolean | null }) => o.isApproved === false,
    ).length;
    const pending = outputs.filter(
      (o: { isApproved: boolean | null }) => o.isApproved === null,
    ).length;
    const avgProcessingMs =
      outputs.reduce(
        (sum: number, o: { processingMs: number | null }) => sum + (o.processingMs || 0),
        0,
      ) / total || 0;

    return {
      modelName,
      periodDays: days,
      totalOutputs: total,
      approved,
      rejected,
      pending,
      approvalRate: total > 0 ? approved / (approved + rejected) : 0,
      avgProcessingMs: Math.round(avgProcessingMs),
    };
  }

  /**
   * Get governance summary across all models
   */
  async getGovernanceSummary() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get counts by output type
    const byType = await this.prisma.aiOutputLog.groupBy({
      by: ['outputType'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    });

    // Get counts by model
    const byModel = await this.prisma.aiOutputLog.groupBy({
      by: ['modelName'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    });

    // Get approval stats
    const approvalStats = await this.prisma.aiOutputLog.groupBy({
      by: ['isApproved'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    });

    // Pending actions requiring human review
    const pendingReorders = await this.prisma.reorderRecommendation.count({
      where: { isReviewed: false },
    });

    const unresolvedAlerts = await this.prisma.anomalyAlert.count({
      where: { isResolved: false },
    });

    return {
      period: '30 days',
      outputsByType: byType.reduce(
        (acc: Record<string, number>, t: { outputType: string; _count: number }) => ({
          ...acc,
          [t.outputType]: t._count,
        }),
        {},
      ),
      outputsByModel: byModel.reduce(
        (acc: Record<string, number>, m: { modelName: string; _count: number }) => ({
          ...acc,
          [m.modelName]: m._count,
        }),
        {},
      ),
      approvalStats: approvalStats.reduce(
        (acc: Record<string, number>, s: { isApproved: boolean | null; _count: number }) => ({
          ...acc,
          [s.isApproved === null ? 'pending' : s.isApproved ? 'approved' : 'rejected']: s._count,
        }),
        {},
      ),
      pendingHumanReview: {
        reorderRecommendations: pendingReorders,
        anomalyAlerts: unresolvedAlerts,
      },
    };
  }

  /**
   * Log job execution for monitoring
   */
  async logJobExecution(
    jobName: string,
    status: 'STARTED' | 'COMPLETED' | 'FAILED',
    details: {
      startedAt: Date;
      completedAt?: Date;
      recordsProcessed?: number;
      errorMessage?: string;
      errorStack?: string;
      metadata?: any;
    },
  ): Promise<string> {
    const durationMs = details.completedAt
      ? details.completedAt.getTime() - details.startedAt.getTime()
      : null;

    const execution = await this.prisma.jobExecution.create({
      data: {
        jobName,
        status,
        startedAt: details.startedAt,
        completedAt: details.completedAt,
        durationMs,
        recordsProcessed: details.recordsProcessed,
        errorMessage: details.errorMessage,
        errorStack: details.errorStack,
        metadata: details.metadata || {},
      },
    });

    if (status === 'FAILED') {
      this.logger.error(`Job ${jobName} failed: ${details.errorMessage}`);
    } else if (status === 'COMPLETED') {
      this.logger.log(
        `Job ${jobName} completed in ${durationMs}ms, processed ${details.recordsProcessed || 0} records`,
      );
    }

    return execution.id;
  }
}
