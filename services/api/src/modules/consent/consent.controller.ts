import { UserRole } from '@hypermarket/shared-types';
import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';

import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ApiErrorResponse } from '@/common/errors';
import { RolesGuard } from '@/common/guards/roles.guard';

import { ConsentService } from './consent.service';
import { RecordConsentDto, CheckConsentDto } from './dto';

/**
 * Consent controller for legal document acceptance
 * Required for compliance before first order (PR#28)
 */
@ApiTags('consent')
@Controller('consent')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post('record')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record user consent for legal documents',
    description: 'تسجيل موافقة المستخدم على الوثائق القانونية - يجب قبل الطلب الأول',
  })
  @ApiResponse({
    status: 201,
    description: 'Consent recorded - تم تسجيل الموافقة',
    schema: {
      example: {
        message: 'تم تسجيل الموافقة بنجاح',
        recorded: 3,
        documents: ['TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'RETURN_REFUND'],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input - بيانات غير صحيحة',
    type: ApiErrorResponse,
  })
  async recordConsent(@Body() dto: RecordConsentDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.consentService.recordConsent(dto, ipAddress, userAgent);

    return {
      message: 'تم تسجيل الموافقة بنجاح',
      ...result,
    };
  }

  @Get('check')
  @Public()
  @ApiOperation({
    summary: 'Check user consent status',
    description: 'التحقق من حالة موافقة المستخدم على الوثائق القانونية',
  })
  @ApiQuery({
    name: 'phone',
    description: 'رقم الهاتف العراقي',
    example: '07701234567',
  })
  @ApiResponse({
    status: 200,
    description: 'Consent status - حالة الموافقة',
    schema: {
      example: {
        hasAcceptedAll: true,
        acceptedDocuments: [
          {
            documentType: 'TERMS_OF_SERVICE',
            version: '1.0',
            acceptedAt: '2026-01-29T10:00:00.000Z',
            isCurrent: true,
          },
        ],
        missingDocuments: [],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid phone - رقم هاتف غير صحيح',
    type: ApiErrorResponse,
  })
  async checkConsent(@Query() dto: CheckConsentDto) {
    return this.consentService.checkConsent(dto.phone);
  }

  @Get('versions')
  @Public()
  @ApiOperation({
    summary: 'Get current document versions',
    description: 'الحصول على إصدارات الوثائق الحالية',
  })
  @ApiResponse({
    status: 200,
    description: 'Document versions - إصدارات الوثائق',
    schema: {
      example: {
        TERMS_OF_SERVICE: '1.0',
        PRIVACY_POLICY: '1.0',
        RETURN_REFUND: '1.0',
      },
    },
  })
  getCurrentVersions() {
    return this.consentService.getCurrentVersions();
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get consent statistics (Admin only)',
    description: 'إحصائيات الموافقات - للمشرفين فقط',
  })
  @ApiResponse({
    status: 200,
    description: 'Consent statistics - إحصائيات الموافقات',
    schema: {
      example: {
        totalConsents: 1500,
        uniqueCustomers: 500,
        byDocumentType: [
          { documentType: 'TERMS_OF_SERVICE', count: 500 },
          { documentType: 'PRIVACY_POLICY', count: 500 },
          { documentType: 'RETURN_REFUND', count: 500 },
        ],
        recentConsents: [
          { date: '2026-01-29', count: 25 },
          { date: '2026-01-28', count: 30 },
        ],
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
    description: 'Forbidden - غير مصرح',
    type: ApiErrorResponse,
  })
  async getStats() {
    return this.consentService.getConsentStats();
  }
}
