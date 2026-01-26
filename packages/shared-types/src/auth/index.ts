/**
 * Authentication and authorization types
 */

import type { BaseEntity } from '../common';

/**
 * User roles in the system
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  PICKER = 'PICKER',
  DRIVER = 'DRIVER',
}

/**
 * Admin permissions
 */
export enum AdminPermission {
  // User management
  USERS_READ = 'users:read',
  USERS_WRITE = 'users:write',
  USERS_DELETE = 'users:delete',

  // Product management
  PRODUCTS_READ = 'products:read',
  PRODUCTS_WRITE = 'products:write',
  PRODUCTS_DELETE = 'products:delete',

  // Category management
  CATEGORIES_READ = 'categories:read',
  CATEGORIES_WRITE = 'categories:write',
  CATEGORIES_DELETE = 'categories:delete',

  // Order management
  ORDERS_READ = 'orders:read',
  ORDERS_WRITE = 'orders:write',
  ORDERS_CANCEL = 'orders:cancel',

  // Delivery management
  DELIVERY_READ = 'delivery:read',
  DELIVERY_ASSIGN = 'delivery:assign',

  // Inventory management
  INVENTORY_READ = 'inventory:read',
  INVENTORY_WRITE = 'inventory:write',

  // Reports
  REPORTS_READ = 'reports:read',
  REPORTS_EXPORT = 'reports:export',

  // Settings
  SETTINGS_READ = 'settings:read',
  SETTINGS_WRITE = 'settings:write',

  // Super admin
  SUPER_ADMIN = 'super:admin',
}

/**
 * JWT Token payload
 */
export interface JwtPayload {
  sub: string; // User ID
  role: UserRole;
  permissions?: AdminPermission[];
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
  phoneNumber: string;
  password: string;
}

/**
 * Phone verification request
 */
export interface PhoneVerificationRequest {
  phoneNumber: string;
}

/**
 * OTP verification
 */
export interface OtpVerification {
  phoneNumber: string;
  code: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  phoneNumber: string;
  code: string;
  newPassword: string;
}

/**
 * Authenticated user session
 */
export interface AuthSession extends BaseEntity {
  userId: string;
  role: UserRole;
  deviceId?: string;
  deviceType?: 'ios' | 'android' | 'web';
  lastActiveAt: Date;
  expiresAt: Date;
}
