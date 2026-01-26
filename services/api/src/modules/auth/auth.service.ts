import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserRole, JwtPayload } from '@hypermarket/shared-types';

import { PrismaService } from '@/prisma/prisma.service';

import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

/**
 * Mock OTP for MVP - always use this code
 */
const MOCK_OTP = '123456';

/**
 * Access token response (no refresh tokens in MVP)
 */
interface AccessTokenResponse {
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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
   * Send OTP to phone (mock implementation for MVP)
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

    // Mock OTP - In production, send SMS here
    this.logger.log(`[MOCK OTP] Sending OTP ${MOCK_OTP} to ${dto.phone}`);

    return { message: 'تم إرسال رمز التحقق' };
  }

  /**
   * Verify OTP and return access token
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<AccessTokenResponse> {
    // Verify mock OTP
    if (dto.otp !== MOCK_OTP) {
      throw new BadRequestException('رمز التحقق غير صحيح');
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

    if (!user || !user.isActive) {
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
