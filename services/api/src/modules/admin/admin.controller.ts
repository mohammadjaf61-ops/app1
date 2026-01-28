import { UserRole } from '@hypermarket/shared-types';
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';

import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('kpis')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get dashboard KPIs (orders today, revenue, pending, out of stock)' })
  async getKPIs() {
    return this.adminService.getKPIs();
  }
}
