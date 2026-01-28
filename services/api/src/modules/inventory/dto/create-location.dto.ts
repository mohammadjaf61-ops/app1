import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({
    description: 'Aisle identifier',
    example: 'A',
  })
  @IsString({ message: 'رقم الممر يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رقم الممر مطلوب' })
  aisle: string;

  @ApiProperty({
    description: 'Shelf identifier',
    example: '1',
  })
  @IsString({ message: 'رقم الرف يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'رقم الرف مطلوب' })
  shelf: string;

  @ApiPropertyOptional({
    description: 'Bin identifier',
    example: 'A',
  })
  @IsOptional()
  @IsString({ message: 'رقم السلة يجب أن يكون نصاً' })
  bin?: string;
}
