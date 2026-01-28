import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsUUID, MinLength, ArrayMinSize } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name in Arabic', example: 'مدير المخزون' })
  @IsString()
  @MinLength(2)
  nameAr: string;

  @ApiPropertyOptional({ description: 'Role name in English', example: 'Inventory Manager' })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional({ description: 'Role description', example: 'يدير المخزون والمنتجات' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'List of permission IDs to assign',
    example: ['uuid1', 'uuid2'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  permissionIds: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Role name in Arabic', example: 'مدير المخزون' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nameAr?: string;

  @ApiPropertyOptional({ description: 'Role name in English', example: 'Inventory Manager' })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional({ description: 'Role description', example: 'يدير المخزون والمنتجات' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'List of permission IDs to assign',
    example: ['uuid1', 'uuid2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds?: string[];
}

export class AssignRoleDto {
  @ApiProperty({ description: 'User ID', example: 'uuid' })
  @IsUUID('4')
  userId: string;

  @ApiProperty({ description: 'Role ID', example: 'uuid' })
  @IsUUID('4')
  roleId: string;
}
