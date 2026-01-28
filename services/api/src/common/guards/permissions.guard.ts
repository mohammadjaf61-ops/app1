import { UserRole } from '@hypermarket/shared-types';
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSIONS_KEY, PermissionRequirement } from '../decorators/require-permission.decorator';

interface RequestUser {
  id: string;
  role: UserRole;
  permissions?: Array<{
    resource: string;
    action: string;
    condition?: string | null;
  }>;
}

/**
 * Default permissions for each UserRole (backwards compatibility)
 * These are used when a user doesn't have custom permissions assigned
 */
const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Array<{ resource: string; action: string }>> = {
  ADMIN: [{ resource: '*', action: 'manage' }], // Full access
  MANAGER: [
    { resource: 'orders', action: 'manage' },
    { resource: 'products', action: 'manage' },
    { resource: 'categories', action: 'manage' },
    { resource: 'inventory', action: 'manage' },
    { resource: 'delivery', action: 'manage' },
    { resource: 'reports', action: 'read' },
    { resource: 'users', action: 'read' },
    { resource: 'pos', action: 'manage' },
    { resource: 'payments', action: 'read' },
  ],
  CASHIER: [
    { resource: 'pos', action: 'manage' },
    { resource: 'orders', action: 'create' },
    { resource: 'orders', action: 'read' },
    { resource: 'products', action: 'read' },
    { resource: 'categories', action: 'read' },
    { resource: 'payments', action: 'create' },
  ],
  PICKER: [
    { resource: 'orders', action: 'read' },
    { resource: 'orders', action: 'update' },
    { resource: 'products', action: 'read' },
    { resource: 'inventory', action: 'read' },
  ],
  DRIVER: [
    { resource: 'delivery', action: 'read' },
    { resource: 'delivery', action: 'update' },
    { resource: 'orders', action: 'read' },
  ],
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionRequirement[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions specified, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: RequestUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('غير مصرح بالوصول');
    }

    // Get user's effective permissions
    const userPermissions = this.getUserPermissions(user);

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((required) =>
      this.hasPermission(userPermissions, required),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('ليس لديك الصلاحية المطلوبة للوصول إلى هذا المورد');
    }

    return true;
  }

  /**
   * Get effective permissions for a user
   * Uses custom permissions if available, otherwise falls back to role defaults
   */
  private getUserPermissions(
    user: RequestUser,
  ): Array<{ resource: string; action: string; condition?: string | null }> {
    // If user has custom permissions loaded, use those
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions;
    }

    // Fall back to default role permissions
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
    return rolePermissions.map((p) => ({ ...p, condition: null }));
  }

  /**
   * Check if user has a specific permission
   */
  private hasPermission(
    userPermissions: Array<{ resource: string; action: string; condition?: string | null }>,
    required: PermissionRequirement,
  ): boolean {
    return userPermissions.some((perm) => {
      // Wildcard resource matches everything
      if (perm.resource === '*') {
        // 'manage' action on wildcard is superadmin
        if (perm.action === 'manage') {
          return true;
        }
      }

      // Check resource match
      if (perm.resource !== required.resource && perm.resource !== '*') {
        return false;
      }

      // 'manage' action includes all other actions
      if (perm.action === 'manage') {
        return true;
      }

      // Check action match
      if (perm.action !== required.action) {
        return false;
      }

      // If required has a condition, user permission must allow it
      // For now, if user has the permission without condition, they have full access
      // If user has 'ownOnly' condition, it will be enforced at the service level

      return true;
    });
  }
}

/**
 * Export default permissions for use in seed
 */
export { DEFAULT_ROLE_PERMISSIONS };
