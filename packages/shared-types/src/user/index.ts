/**
 * User-related types
 */

import type { UserRole, AdminPermission } from '../auth';
import type { BaseEntity, SoftDelete, DeliveryAddress } from '../common';

/**
 * User status
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

/**
 * Base user interface
 */
export interface User extends BaseEntity, SoftDelete {
  phoneNumber: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  isPhoneVerified: boolean;
  lastLoginAt?: Date;
}

/**
 * Customer profile
 */
export interface Customer extends User {
  role: UserRole.CUSTOMER;
  firstName: string;
  lastName: string;
  addresses: CustomerAddress[];
  defaultAddressId?: string;
}

/**
 * Customer saved address
 */
export interface CustomerAddress extends BaseEntity {
  customerId: string;
  label: string; // e.g., "المنزل", "العمل"
  address: DeliveryAddress;
  isDefault: boolean;
}

/**
 * Admin user
 */
export interface Admin extends User {
  role: UserRole.ADMIN;
  firstName: string;
  lastName: string;
  permissions: AdminPermission[];
  isSuperAdmin: boolean;
}

/**
 * Picker (in-store staff)
 */
export interface Picker extends User {
  role: UserRole.PICKER;
  firstName: string;
  lastName: string;
  employeeId: string;
  isAvailable: boolean;
  currentOrderId?: string;
}

/**
 * Driver (delivery staff)
 */
export interface Driver extends User {
  role: UserRole.DRIVER;
  firstName: string;
  lastName: string;
  employeeId: string;
  vehicleType: VehicleType;
  vehiclePlateNumber: string;
  isAvailable: boolean;
  currentDeliveryId?: string;
}

/**
 * Vehicle types for drivers
 */
export enum VehicleType {
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  VAN = 'VAN',
}

/**
 * User registration DTO
 */
export interface CustomerRegistration {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  password: string;
}

/**
 * User profile update DTO
 */
export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
}
