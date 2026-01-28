import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Permission requirement definition
 */
export interface PermissionRequirement {
  /** Resource name (e.g., 'orders', 'products', 'inventory') */
  resource: string;
  /** Action type (e.g., 'create', 'read', 'update', 'delete', 'manage') */
  action: string;
  /** Optional condition (e.g., 'ownOnly' to restrict to own records) */
  condition?: 'ownOnly';
}

/**
 * Decorator to specify required permissions for a route
 *
 * @example
 * // Require read permission on orders
 * @RequirePermission({ resource: 'orders', action: 'read' })
 *
 * @example
 * // Require manage permission (full access)
 * @RequirePermission({ resource: 'products', action: 'manage' })
 *
 * @example
 * // Require permission with condition
 * @RequirePermission({ resource: 'orders', action: 'read', condition: 'ownOnly' })
 */
export const RequirePermission = (...permissions: PermissionRequirement[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
