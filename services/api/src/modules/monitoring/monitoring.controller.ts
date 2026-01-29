import { UserRole } from '@hypermarket/shared-types';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';

import { AlertLog, MetricsSnapshot, OperationalThresholds, SystemHealth } from './monitoring.types';
import { MetricsService } from './metrics.service';
import { AlertsService } from './alerts.service';

@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly alertsService: AlertsService,
  ) {}

  @Get('metrics')
  @Public()
  @ApiOperation({ summary: 'Get current system metrics' })
  @ApiResponse({ status: 200, description: 'Metrics snapshot' })
  async getMetrics(): Promise<MetricsSnapshot> {
    return this.metricsService.getSnapshot();
  }

  @Get('status')
  @Public()
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health status' })
  async getStatus(): Promise<SystemHealth> {
    return this.alertsService.getSystemHealth();
  }

  @Get('alerts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get recent alerts' })
  @ApiQuery({ name: 'active', required: false, description: 'Filter to active alerts only' })
  @ApiResponse({ status: 200, description: 'Alert log' })
  async getAlerts(@Query('active') active?: string): Promise<AlertLog> {
    return this.alertsService.getAlerts(active === 'true');
  }

  @Get('thresholds')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get current operational thresholds' })
  @ApiResponse({ status: 200, description: 'Operational thresholds' })
  getThresholds(): OperationalThresholds {
    return this.alertsService.getThresholds();
  }
}
