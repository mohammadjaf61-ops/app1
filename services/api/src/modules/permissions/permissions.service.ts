import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // PERMISSIONS
  // ============================================

  /**
   * Get all permissions
   */
  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  /**
   * Get permissions grouped by resource
   */
  async getPermissionsGrouped() {
    const permissions = await this.getAllPermissions();

    const grouped: Record<
      string,
      Array<{
        id: string;
        action: string;
        descriptionAr: string | null;
        descriptionEn: string | null;
      }>
    > = {};

    for (const perm of permissions) {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push({
        id: perm.id,
        action: perm.action,
        descriptionAr: perm.descriptionAr,
        descriptionEn: perm.descriptionEn,
      });
    }

    return grouped;
  }

  // ============================================
  // ROLES
  // ============================================

  /**
   * Get all roles with their permissions
   */
  async getAllRoles() {
    return this.prisma.role.findMany({
      where: { isActive: true },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: [{ isSystem: 'desc' }, { nameAr: 'asc' }],
    });
  }

  /**
   * Get a single role by ID
   */
  async getRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('الدور غير موجود');
    }

    return role;
  }

  /**
   * Create a new custom role
   */
  async createRole(data: {
    nameAr: string;
    nameEn?: string;
    description?: string;
    permissionIds: string[];
  }) {
    // Verify all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: data.permissionIds } },
    });

    if (permissions.length !== data.permissionIds.length) {
      throw new BadRequestException('بعض الصلاحيات المحددة غير موجودة');
    }

    return this.prisma.role.create({
      data: {
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        isSystem: false,
        permissions: {
          create: data.permissionIds.map((permId) => ({
            permissionId: permId,
          })),
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Update an existing role
   */
  async updateRole(
    id: string,
    data: {
      nameAr?: string;
      nameEn?: string;
      description?: string;
      permissionIds?: string[];
    },
  ) {
    const role = await this.prisma.role.findUnique({ where: { id } });

    if (!role) {
      throw new NotFoundException('الدور غير موجود');
    }

    if (role.isSystem) {
      throw new BadRequestException('لا يمكن تعديل الأدوار الأساسية للنظام');
    }

    // If permissions are being updated, verify they exist
    if (data.permissionIds) {
      const permissions = await this.prisma.permission.findMany({
        where: { id: { in: data.permissionIds } },
      });

      if (permissions.length !== data.permissionIds.length) {
        throw new BadRequestException('بعض الصلاحيات المحددة غير موجودة');
      }
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update role basic info
      await tx.role.update({
        where: { id },
        data: {
          nameAr: data.nameAr,
          nameEn: data.nameEn,
          description: data.description,
        },
      });

      // Update permissions if provided
      if (data.permissionIds) {
        // Delete existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        // Add new permissions
        await tx.rolePermission.createMany({
          data: data.permissionIds.map((permId: string) => ({
            roleId: id,
            permissionId: permId,
          })),
        });
      }

      return tx.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });
  }

  /**
   * Delete a custom role
   */
  async deleteRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!role) {
      throw new NotFoundException('الدور غير موجود');
    }

    if (role.isSystem) {
      throw new BadRequestException('لا يمكن حذف الأدوار الأساسية للنظام');
    }

    if (role._count.users > 0) {
      throw new BadRequestException(
        `لا يمكن حذف هذا الدور لأنه مرتبط بـ ${role._count.users} مستخدم`,
      );
    }

    await this.prisma.role.delete({ where: { id } });

    return { success: true };
  }

  // ============================================
  // USER ROLES
  // ============================================

  /**
   * Assign a custom role to a user
   */
  async assignRoleToUser(userId: string, roleId: string) {
    const [user, role] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.role.findUnique({ where: { id: roleId } }),
    ]);

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (!role) {
      throw new NotFoundException('الدور غير موجود');
    }

    if (!role.isActive) {
      throw new BadRequestException('هذا الدور غير فعال');
    }

    // Check if already assigned
    const existing = await this.prisma.userCustomRole.findUnique({
      where: {
        userId_roleId: { userId, roleId },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.userCustomRole.create({
      data: { userId, roleId },
    });
  }

  /**
   * Remove a custom role from a user
   */
  async removeRoleFromUser(userId: string, roleId: string) {
    const assignment = await this.prisma.userCustomRole.findUnique({
      where: {
        userId_roleId: { userId, roleId },
      },
    });

    if (!assignment) {
      throw new NotFoundException('المستخدم ليس لديه هذا الدور');
    }

    await this.prisma.userCustomRole.delete({
      where: { id: assignment.id },
    });

    return { success: true };
  }

  /**
   * Get all permissions for a user (combining base role + custom roles)
   */
  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // Collect all permissions from custom roles
    const permissions: Array<{
      resource: string;
      action: string;
      condition: string | null;
    }> = [];

    for (const userRole of user.customRoles) {
      for (const rolePerm of userRole.role.permissions) {
        // Avoid duplicates
        const exists = permissions.some(
          (p) =>
            p.resource === rolePerm.permission.resource && p.action === rolePerm.permission.action,
        );

        if (!exists) {
          permissions.push({
            resource: rolePerm.permission.resource,
            action: rolePerm.permission.action,
            condition: rolePerm.condition,
          });
        }
      }
    }

    return {
      userId: user.id,
      baseRole: user.role,
      customRoles: user.customRoles.map((ur: (typeof user.customRoles)[0]) => ({
        id: ur.role.id,
        nameAr: ur.role.nameAr,
        nameEn: ur.role.nameEn,
      })),
      permissions,
    };
  }
}
