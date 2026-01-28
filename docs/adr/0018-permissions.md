# ADR 0018: Permission-Based Access Control (RBAC)

## Status

Accepted

## Context

The hypermarket platform previously used a simple role-based access control (RBAC) system with fixed roles (ADMIN, MANAGER, CASHIER, PICKER, DRIVER). This approach had limitations:

1. **Inflexible**: Adding new roles required code changes
2. **Coarse-grained**: All users with the same role had identical permissions
3. **No customization**: Business owners couldn't create custom roles like "Inventory Manager" or "Accountant"

The business requirement was to support:
- Custom role creation without code changes
- Fine-grained permission assignment
- Backwards compatibility with existing role-based guards

## Decision

We implemented a **hybrid permission system** that supports both the existing role-based access and new permission-based access:

### Database Schema

Four new tables were added:

```
Permission {
  id          String @id
  resource    String    // e.g., "orders", "products", "inventory"
  action      String    // e.g., "create", "read", "update", "delete", "manage"
  descriptionAr String?
  descriptionEn String?
  @@unique([resource, action])
}

Role {
  id          String @id
  nameAr      String
  nameEn      String? @unique
  description String?
  isSystem    Boolean @default(false)  // System roles can't be modified
  isActive    Boolean @default(true)
}

RolePermission {
  roleId       String
  permissionId String
  condition    String?  // Optional: "ownOnly" for record-level filtering
  @@unique([roleId, permissionId])
}

UserCustomRole {
  userId String
  roleId String
  @@unique([userId, roleId])
}
```

### Permission Actions

The system supports five standard actions per resource:

| Action | Description |
|--------|-------------|
| `create` | Create new records |
| `read` | View records |
| `update` | Modify existing records |
| `delete` | Remove records |
| `manage` | Full access (includes all above) |

### Resources

Permissions are defined for the following resources:

- `orders` - Order management
- `products` - Product catalog
- `categories` - Category management
- `inventory` - Stock management
- `delivery` - Delivery assignments
- `reports` - Analytics and reports
- `users` - User management
- `pos` - Point of sale
- `payments` - Payment processing
- `settings` - System settings
- `permissions` - Roles and permissions management

### Preset System Roles

Five system roles are seeded with appropriate permissions:

| Role | Key Permissions |
|------|-----------------|
| ADMIN | All permissions (`*:manage`) |
| MANAGER | orders, products, categories, inventory, delivery, pos (manage), reports, users (read) |
| CASHIER | pos (manage), orders (create, read), products (read), payments (create) |
| PICKER | orders (read, update), products (read), inventory (read) |
| DRIVER | delivery (read, update), orders (read) |

### Guard Implementation

The `PermissionsGuard` provides permission checking with backwards compatibility:

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // 1. Get required permissions from @RequirePermission decorator
    // 2. Get user's effective permissions:
    //    - If user has custom roles, use those permissions
    //    - Otherwise, fall back to DEFAULT_ROLE_PERMISSIONS based on UserRole
    // 3. Check if user has all required permissions
  }
}
```

**Backwards Compatibility**: The existing `@Roles()` decorator and `RolesGuard` continue to work. The new `@RequirePermission()` decorator can be used alongside or instead of `@Roles()`.

### Usage Examples

```typescript
// Old style (still works)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Get('orders')
async getOrders() { }

// New style
@RequirePermission({ resource: 'orders', action: 'read' })
@Get('orders')
async getOrders() { }

// Mixed (both checks apply)
@Roles(UserRole.ADMIN)
@RequirePermission({ resource: 'orders', action: 'manage' })
@Delete('orders/:id')
async deleteOrder() { }
```

### Admin UI

A new roles management page allows:
- Viewing all roles with their permissions
- Creating custom roles with selected permissions
- Editing custom role permissions
- Deleting unused custom roles (system roles are protected)

## Consequences

### Positive

1. **Flexible role creation**: Business owners can create custom roles without code changes
2. **Fine-grained access**: Permissions can be granted at resource+action level
3. **Backwards compatible**: Existing `@Roles()` guards continue to work
4. **Auditable**: Clear mapping of who has access to what
5. **Scalable**: New resources/actions can be added without schema changes

### Negative

1. **Complexity**: Two systems (roles + permissions) need to be understood
2. **Migration effort**: Existing controllers could be updated to use `@RequirePermission`
3. **Performance**: Additional DB query for custom roles (mitigated by caching)

### Future Enhancements

1. **Condition support**: Implement `ownOnly` condition for record-level access control
2. **Permission caching**: Cache user permissions in JWT or Redis
3. **Audit logging**: Log permission checks and access attempts
4. **UI improvements**: Permission matrix view, bulk assignment

## API Reference

### Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/permissions` | List all permissions | Admin, Manager |
| GET | `/permissions/grouped` | Permissions by resource | Admin, Manager |
| GET | `/permissions/roles` | List all roles | Admin, Manager |
| GET | `/permissions/roles/:id` | Get role details | Admin, Manager |
| POST | `/permissions/roles` | Create custom role | Admin |
| PUT | `/permissions/roles/:id` | Update role | Admin |
| DELETE | `/permissions/roles/:id` | Delete custom role | Admin |
| POST | `/permissions/users/assign` | Assign role to user | Admin |
| DELETE | `/permissions/users/:userId/roles/:roleId` | Remove role from user | Admin |
| GET | `/permissions/users/:userId` | Get user's permissions | Admin, Manager |

## Related

- ADR 0001: Architecture Guidelines
- `services/api/src/modules/permissions/` - Backend implementation
- `apps/admin-web/src/app/dashboard/roles/` - Admin UI
