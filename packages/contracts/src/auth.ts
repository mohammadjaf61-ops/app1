/**
 * Authentication Zod schemas
 */
import { z } from 'zod';

import { BaseEntitySchema } from './common';

/**
 * User roles enum
 */
export const UserRoleSchema = z.enum(['ADMIN', 'MANAGER', 'PICKER', 'DRIVER', 'CASHIER']);

export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Iraqi phone number pattern (07XXXXXXXXX)
 */
const iraqiPhoneRegex = /^07[0-9]{9}$/;

/**
 * Login request schema
 */
export const LoginRequestSchema = z.object({
  phone: z.string().regex(iraqiPhoneRegex, 'رقم الهاتف يجب أن يكون بصيغة 07XXXXXXXXX'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * User profile schema
 */
export const UserProfileSchema = BaseEntitySchema.extend({
  phone: z.string(),
  name: z.string(),
  role: UserRoleSchema,
  isActive: z.boolean(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * Token response schema
 */
export const TokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal('Bearer'),
});

export type TokenResponse = z.infer<typeof TokenResponseSchema>;

/**
 * Login response schema
 */
export const LoginResponseSchema = z.object({
  user: UserProfileSchema,
  tokens: TokenResponseSchema,
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/**
 * OTP request schema
 */
export const OtpRequestSchema = z.object({
  phone: z.string().regex(iraqiPhoneRegex, 'رقم الهاتف يجب أن يكون بصيغة 07XXXXXXXXX'),
});

export type OtpRequest = z.infer<typeof OtpRequestSchema>;

/**
 * OTP verify request schema
 */
export const OtpVerifyRequestSchema = z.object({
  phone: z.string().regex(iraqiPhoneRegex, 'رقم الهاتف يجب أن يكون بصيغة 07XXXXXXXXX'),
  code: z.string().length(6, 'رمز التحقق يجب أن يكون 6 أرقام'),
});

export type OtpVerifyRequest = z.infer<typeof OtpVerifyRequestSchema>;

/**
 * OTP response schema
 */
export const OtpResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  expiresIn: z.number().optional(),
});

export type OtpResponse = z.infer<typeof OtpResponseSchema>;

/**
 * OTP verify response schema
 */
export const OtpVerifyResponseSchema = z.object({
  user: UserProfileSchema,
  tokens: TokenResponseSchema,
});

export type OtpVerifyResponse = z.infer<typeof OtpVerifyResponseSchema>;

/**
 * Refresh token request schema
 */
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

/**
 * Change password request schema
 */
export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
