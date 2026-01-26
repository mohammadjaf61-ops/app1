import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UserRole, TokenResponse, JwtPayload } from '@hypermarket/shared-types';

import { PrismaService } from '@/prisma/prisma.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenResponse> {
    // Check if phone number already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (existingUser) {
      throw new ConflictException('رقم الهاتف مسجل مسبقاً');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        phoneNumber: dto.phoneNumber,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.CUSTOMER,
      },
    });

    this.logger.log(`New customer registered: ${user.id}`);

    return this.generateTokens(user.id, user.role as UserRole);
  }

  async login(dto: LoginDto): Promise<TokenResponse> {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user) {
      throw new UnauthorizedException('رقم الهاتف أو كلمة المرور غير صحيحة');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('رقم الهاتف أو كلمة المرور غير صحيحة');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`User logged in: ${user.id}`);

    return this.generateTokens(user.id, user.role as UserRole);
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('رمز التحديث غير صالح');
      }

      return this.generateTokens(user.id, user.role as UserRole);
    } catch {
      throw new UnauthorizedException('رمز التحديث غير صالح أو منتهي الصلاحية');
    }
  }

  async validateUser(userId: string): Promise<JwtPayload | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return null;
    }

    return {
      sub: user.id,
      role: user.role as UserRole,
    };
  }

  private generateTokens(userId: string, role: UserRole): TokenResponse {
    const payload: JwtPayload = {
      sub: userId,
      role,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      tokenType: 'Bearer',
    };
  }
}
