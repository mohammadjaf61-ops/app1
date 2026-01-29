import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { AnalyticsService } from './analytics.service';
import { AiGovernanceService } from './services/ai-governance.service';
import { AiInsightsService } from './services/ai-insights.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { BasketAnalysisService } from './services/basket-analysis.service';
import { ReorderService } from './services/reorder.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly reorder: ReorderService,
    private readonly basket: BasketAnalysisService,
    private readonly anomaly: AnomalyDetectionService,
    private readonly governance: AiGovernanceService,
    private readonly insights: AiInsightsService,
  ) {}

  // ============================================
  // KPIs & DASHBOARDS
  // ============================================

  @Get('kpi-summary')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get KPI summary for dashboard' })
  async getKpiSummary() {
    return this.analytics.getKpiSummary();
  }

  @Get('daily-sales')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get daily sales reports' })
  async getDailySales(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.analytics.getDailySalesReport(new Date(startDate), new Date(endDate));
  }

  @Get('category-sales')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get category-level sales' })
  async getCategorySales(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.analytics.getCategorySales(new Date(startDate), new Date(endDate));
  }

  @Get('top-products')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get top selling products' })
  async getTopProducts(@Query('limit') limit: string = '10', @Query('days') days: string = '7') {
    return this.analytics.getTopProducts(parseInt(limit), parseInt(days));
  }

  // ============================================
  // DEMAND FORECASTING
  // ============================================

  @Get('forecasts/:productId')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get demand forecasts for a product' })
  async getDemandForecasts(
    @Param('productId') productId: string,
    @Query('days') days: string = '14',
  ) {
    return this.analytics.getDemandForecasts(productId, parseInt(days));
  }

  // ============================================
  // REORDER RECOMMENDATIONS
  // ============================================

  @Get('reorder-recommendations')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get reorder recommendations' })
  async getReorderRecommendations(@Query('urgency') urgency?: string) {
    return this.analytics.getReorderRecommendations(urgency);
  }

  @Post('reorder-recommendations/:id/review')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Review a reorder recommendation' })
  async reviewRecommendation(
    @Param('id') id: string,
    @Body() body: { approved: boolean },
    @CurrentUser() user: any,
  ) {
    await this.reorder.reviewRecommendation(id, user.id, body.approved);
    return { success: true };
  }

  @Get('stock-depletion')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get stock depletion rates' })
  async getStockDepletion(@Query('days') days: string = '30') {
    return this.reorder.getStockDepletionRates(parseInt(days));
  }

  // ============================================
  // BASKET ANALYSIS
  // ============================================

  @Get('basket-recommendations/:productId')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get product recommendations based on basket analysis' })
  async getBasketRecommendations(
    @Param('productId') productId: string,
    @Query('limit') limit: string = '5',
  ) {
    return this.basket.getRecommendations(productId, parseInt(limit));
  }

  @Get('top-product-pairs')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get top product pairs by association strength' })
  async getTopProductPairs(@Query('limit') limit: string = '20') {
    return this.basket.getTopProductPairs(parseInt(limit));
  }

  // ============================================
  // ANOMALY ALERTS
  // ============================================

  @Get('alerts')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get active anomaly alerts' })
  async getActiveAlerts(@Query('severity') severity?: string) {
    return this.analytics.getActiveAlerts(severity);
  }

  @Post('alerts/:id/resolve')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Resolve an anomaly alert' })
  async resolveAlert(
    @Param('id') id: string,
    @Body() body: { resolutionNotes?: string },
    @CurrentUser() user: any,
  ) {
    await this.anomaly.resolveAlert(id, user.id, body.resolutionNotes);
    return { success: true };
  }

  // ============================================
  // AI INSIGHTS (PR#24)
  // Read-only, explainable decision support
  // ============================================

  @Get('insights')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get AI-powered operational insights with explanations' })
  async getInsights() {
    return this.insights.getAllInsights();
  }

  @Get('insights/status')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Check if AI insights feature is enabled' })
  async getInsightsStatus() {
    const enabled = await this.insights.isEnabled();
    return { enabled };
  }

  // ============================================
  // AI GOVERNANCE
  // ============================================

  @Get('ai-governance/summary')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get AI governance summary' })
  async getGovernanceSummary() {
    return this.governance.getGovernanceSummary();
  }

  @Get('ai-governance/audit')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get AI output audit trail' })
  async getAuditTrail(
    @Query('outputType') outputType?: string,
    @Query('modelName') modelName?: string,
    @Query('limit') limit: string = '100',
  ) {
    return this.governance.getAuditTrail({ outputType, modelName }, parseInt(limit));
  }

  @Get('ai-governance/model-metrics/:modelName')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get model performance metrics' })
  async getModelMetrics(@Param('modelName') modelName: string, @Query('days') days: string = '30') {
    return this.governance.getModelMetrics(modelName, parseInt(days));
  }

  @Post('ai-governance/outputs/:id/approve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approve an AI output' })
  async approveOutput(
    @Param('id') id: string,
    @Body() body: { feedback?: string },
    @CurrentUser() user: any,
  ) {
    await this.governance.approveOutput(id, user.id, body.feedback);
    return { success: true };
  }

  @Post('ai-governance/outputs/:id/reject')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reject an AI output' })
  async rejectOutput(
    @Param('id') id: string,
    @Body() body: { feedback: string },
    @CurrentUser() user: any,
  ) {
    await this.governance.rejectOutput(id, user.id, body.feedback);
    return { success: true };
  }

  // ============================================
  // JOB MANAGEMENT
  // ============================================

  @Get('jobs/history')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get job execution history' })
  async getJobHistory(@Query('jobName') jobName?: string, @Query('limit') limit: string = '20') {
    return this.analytics.getJobExecutionHistory(jobName, parseInt(limit));
  }

  @Post('jobs/trigger')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Manually trigger analytics jobs' })
  async triggerJobs(@Body() body: { jobType: string }) {
    switch (body.jobType) {
      case 'daily-sales':
        await this.analytics.triggerDailySalesAggregation();
        break;
      case 'full':
        await this.analytics.triggerFullAnalyticsRun();
        break;
      default:
        throw new Error(`Unknown job type: ${body.jobType}`);
    }
    return { success: true, message: 'Job queued' };
  }
}
