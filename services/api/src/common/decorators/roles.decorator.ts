import { SetMetadata } from '@nestjs/common';

import { UserRole } from '@hypermarket/shared-types';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
