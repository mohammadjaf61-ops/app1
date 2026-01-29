import { UserRole } from '@hypermarket/shared-types';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import { Roles } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from './dto';
import { PermissionsService } from './permissions.service';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // ============================================
  // PERMISSIONS
  // ============================================

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'List of all permissions' })
  async getAllPermissions() {
    return this.permissionsService.getAllPermissions();
  }

  @Get('grouped')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get permissions grouped by resource' })
  @ApiResponse({ status: 200, description: 'Permissions grouped by resource' })
  async getPermissionsGrouped() {
    return this.permissionsService.getPermissionsGrouped();
  }

  // ============================================
  // ROLES
  // ============================================

  @Get('roles')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all roles with their permissions' })
  @ApiResponse({ status: 200, description: 'List of all roles' })
  async getAllRoles() {
    return this.permissionsService.getAllRoles();
  }

  @Get('roles/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get a single role by ID' })
  @ApiResponse({ status: 200, description: 'Role details' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRoleById(@Param('id', ParseUUIDPipe) id: string) {
    return this.permissionsService.getRoleById(id);
  }

  @Post('roles')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new custom role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid permission IDs' })
  async createRole(@Body() dto: CreateRoleDto) {
    return this.permissionsService.createRole(dto);
  }

  @Put('roles/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an existing role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot modify system roles' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async updateRole(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.permissionsService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a custom role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete system roles or roles with users' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async deleteRole(@Param('id', ParseUUIDPipe) id: string) {
    return this.permissionsService.deleteRole(id);
  }

  // ============================================
  // USER ROLES
  // ============================================

  @Post('users/assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign a custom role to a user' })
  @ApiResponse({ status: 201, description: 'Role assigned successfully' })
  @ApiResponse({ status: 404, description: 'User or role not found' })
  async assignRoleToUser(@Body() dto: AssignRoleDto) {
    return this.permissionsService.assignRoleToUser(dto.userId, dto.roleId);
  }

  @Delete('users/:userId/roles/:roleId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a custom role from a user' })
  @ApiResponse({ status: 200, description: 'Role removed successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async removeRoleFromUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.permissionsService.removeRoleFromUser(userId, roleId);
  }

  @Get('users/:userId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all permissions for a user' })
  @ApiResponse({ status: 200, description: 'User permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPermissions(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.permissionsService.getUserPermissions(userId);
  }
}
