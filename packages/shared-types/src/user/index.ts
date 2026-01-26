/**
 * User-related types
 */

import type { UserRole } from '../auth';
import type { BaseEntity } from '../common';

/**
 * User (Staff member)
 * Note: Customers are not users in this system - their info is stored directly on orders
 */
export interface User extends BaseEntity {
  fullName: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
}

/**
 * Create user DTO
 */
export interface CreateUserDto {
  fullName: string;
  phone: string;
  password: string;
  role: UserRole;
}

/**
 * Update user DTO
 */
export interface UpdateUserDto {
  fullName?: string;
  phone?: string;
  isActive?: boolean;
}

/**
 * User list filters
 */
export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

/**
 * User profile response (safe for client)
 */
export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
}
