/**
 * Authentication and authorization types
 */

/**
 * User roles in the system
 * No CUSTOMER role - orders store customer info directly
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  PICKER = 'PICKER',
  DRIVER = 'DRIVER',
  CASHIER = 'CASHIER',
}

/**
 * JWT Token payload
 */
export interface JwtPayload {
  sub: string; // User ID
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Access token response
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  phone: string;
  password: string;
}

/**
 * Change password DTO
 */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}
