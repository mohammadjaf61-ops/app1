import { z } from 'zod';

import { IraqiPhoneSchema, UUIDSchema, DateTimeSchema } from './common';

/**
 * User roles enum
 */
export const UserRoleSchema = z.enum(['ADMIN', 'CUSTOMER', 'PICKER', 'DRIVER']);
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Login request (for staff: admin, picker, driver)
 */
export const LoginRequestSchema = z.object({
  phone: IraqiPhoneSchema,
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * Send OTP request (for customers)
 */
export const SendOtpRequestSchema = z.object({
  phone: IraqiPhoneSchema,
});

export type SendOtpRequest = z.infer<typeof SendOtpRequestSchema>;

/**
 * Verify OTP request
 */
export const VerifyOtpRequestSchema = z.object({
  phone: IraqiPhoneSchema,
  otp: z.string().length(6, 'رمز التحقق يجب أن يكون 6 أرقام'),
});

export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>;

/**
 * Register request (for customers)
 */
export const RegisterRequestSchema = z.object({
  phoneNumber: IraqiPhoneSchema,
  firstName: z.string().min(2, 'الاسم الأول مطلوب'),
  lastName: z.string().min(2, 'اسم العائلة مطلوب'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  email: z.string().email().optional(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

/**
 * User profile in responses
 */
export const UserProfileSchema = z.object({
  id: UUIDSchema,
  phone: z.string(),
  fullName: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().email().nullable(),
  role: UserRoleSchema,
  isActive: z.boolean(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * Auth tokens response
 */
export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int(),
});

export type AuthTokens = z.infer<typeof AuthTokensSchema>;

/**
 * Login response
 */
export const LoginResponseSchema = z.object({
  user: UserProfileSchema,
  tokens: AuthTokensSchema,
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/**
 * OTP send response
 */
export const SendOtpResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  expiresIn: z.number().int().optional(),
});

export type SendOtpResponse = z.infer<typeof SendOtpResponseSchema>;

/**
 * OTP verify response (same as login for customers)
 */
export const VerifyOtpResponseSchema = LoginResponseSchema;
export type VerifyOtpResponse = z.infer<typeof VerifyOtpResponseSchema>;

/**
 * Refresh token request
 */
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

/**
 * Refresh token response
 */
export const RefreshTokenResponseSchema = AuthTokensSchema;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
