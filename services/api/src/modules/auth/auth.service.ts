import { UserRole, JwtPayload } from '@hypermarket/shared-types';
import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '@/prisma/prisma.service';

import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

/**
 * Development-only OTP for testing (only used when USE_MOCK_OTP=true)
 */
const DEV_OTP = '123456';

/**
 * Access token response (no refresh tokens in MVP)
 */
export interface AccessTokenResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: {
    id: string;
    fullName: string;
    phone: string;
    role: UserRole;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly useMockOtp: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.useMockOtp = this.configService.get<string>('USE_MOCK_OTP') === 'true';
    if (this.useMockOtp) {
      this.logger.warn('⚠️ Mock OTP mode enabled - DO NOT use in production!');
    }
  }

  /**
   * Login with phone and password (staff login)
   */
  async login(dto: LoginDto): Promise<AccessTokenResponse> {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new UnauthorizedException('رقم الهاتف أو كلمة المرور غير صحيحة');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('الحساب معطل');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('رقم الهاتف أو كلمة المرور غير صحيحة');
    }

    this.logger.log(`User logged in: ${user.id} (${user.role})`);

    return this.generateAccessToken(user);
  }

  /**
   * Send OTP to phone
   * In development: Uses mock OTP when USE_MOCK_OTP=true
   * In production: Should integrate with SMS provider
   */
  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new BadRequestException('رقم الهاتف غير مسجل');
    }

    if (!user.isActive) {
      throw new BadRequestException('الحساب معطل');
    }

    if (this.useMockOtp) {
      // Development mode - use fixed OTP
      this.logger.log(`[DEV] OTP requested for phone ending in ...${dto.phone.slice(-4)}`);
    } else {
      // Production mode - integrate with SMS provider here
      // TODO: Implement SMS provider integration
      this.logger.log(`Sending OTP to phone ending in ...${dto.phone.slice(-4)}`);
    }

    return { message: 'تم إرسال رمز التحقق' };
  }

  /**
   * Verify OTP and return access token
   * In development: Uses DEV_OTP when USE_MOCK_OTP=true
   * In production: Should verify against stored OTP from SMS provider
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<AccessTokenResponse> {
    // Verify OTP based on mode
    if (this.useMockOtp) {
      // Development mode - accept fixed OTP
      if (dto.otp !== DEV_OTP) {
        throw new BadRequestException('رمز التحقق غير صحيح');
      }
    } else {
      // Production mode - verify against stored OTP
      // TODO: Implement real OTP verification with SMS provider
      throw new BadRequestException('نظام التحقق غير متوفر حالياً');
    }

    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new BadRequestException('رقم الهاتف غير مسجل');
    }

    if (!user.isActive) {
      throw new BadRequestException('الحساب معطل');
    }

    // Security: Log user ID only, not phone or OTP (PR#20)
    this.logger.log(`OTP verified for user: ${user.id}`);

    return this.generateAccessToken(user);
  }

  /**
   * Validate user from JWT payload
   */
  async validateUser(userId: string): Promise<JwtPayload | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user?.isActive) {
      return null;
    }

    return {
      sub: user.id,
      role: user.role as UserRole,
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }

    return user;
  }

  /**
   * Generate access token (no refresh token in MVP)
   */
  private generateAccessToken(user: {
    id: string;
    fullName: string;
    phone: string;
    role: string;
  }): AccessTokenResponse {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role as UserRole,
    };

    const expiresIn = 86400; // 24 hours in seconds
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: `${expiresIn}s`,
    });

    return {
      accessToken,
      expiresIn,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role as UserRole,
      },
    };
  }
}
