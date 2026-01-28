import { JwtPayload } from '@hypermarket/shared-types';
import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ApiErrorResponse } from '@/common/errors';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with phone and password',
    description: 'تسجيل دخول الموظفين باستخدام رقم الهاتف وكلمة المرور',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      admin: {
        summary: 'Admin login',
        value: { phone: '07701234567', password: 'admin123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful - تم تسجيل الدخول',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid',
          phone: '07701234567',
          name: 'أحمد محمد',
          role: 'ADMIN',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials - بيانات الدخول غير صحيحة',
    type: ApiErrorResponse,
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('otp/send')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send OTP to phone',
    description: 'إرسال رمز التحقق للعميل عبر SMS (mock في MVP)',
  })
  @ApiBody({
    type: SendOtpDto,
    examples: {
      customer: {
        summary: 'Customer phone',
        value: { phone: '07712345678' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully - تم إرسال رمز التحقق',
    schema: {
      example: {
        message: 'تم إرسال رمز التحقق',
        expiresIn: 300,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Phone not registered - رقم الهاتف غير مسجل',
    type: ApiErrorResponse,
  })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('otp/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP and get token',
    description: 'التحقق من رمز OTP والحصول على توكن الدخول',
  })
  @ApiBody({
    type: VerifyOtpDto,
    examples: {
      verify: {
        summary: 'Verify OTP',
        value: { phone: '07712345678', otp: '123456' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified - تم التحقق',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid',
          phone: '07712345678',
          name: 'علي حسين',
          role: 'CUSTOMER',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP - رمز التحقق غير صحيح',
    type: ApiErrorResponse,
  })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'الحصول على بيانات المستخدم الحالي',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile - بيانات المستخدم',
    schema: {
      example: {
        id: 'uuid',
        phone: '07701234567',
        name: 'أحمد محمد',
        role: 'ADMIN',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - يجب تسجيل الدخول',
    type: ApiErrorResponse,
  })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }
}
