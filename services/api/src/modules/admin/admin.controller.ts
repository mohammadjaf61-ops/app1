import { UserRole } from '@hypermarket/shared-types';
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import { ApiErrorResponse } from '@/common/errors';

import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('kpis')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get dashboard KPIs',
    description: `
مؤشرات الأداء الرئيسية للوحة التحكم

**المؤشرات:**
- totalOrdersToday: عدد طلبات اليوم
- revenueToday: إيرادات اليوم (بالدينار)
- pendingOrders: طلبات معلقة
- outOfStockCount: منتجات نفذت من المخزون

**التخزين المؤقت:** 60 ثانية
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard KPIs - مؤشرات الأداء',
    schema: {
      example: {
        totalOrdersToday: 42,
        revenueToday: 5250000,
        pendingOrders: 8,
        outOfStockCount: 3,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - يجب تسجيل الدخول',
    type: ApiErrorResponse,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - للمدير فقط',
    type: ApiErrorResponse,
  })
  async getKPIs() {
    return this.adminService.getKPIs();
  }
}
