import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, IsEnum, IsArray, ArrayMinSize } from 'class-validator';

/**
 * Consent document types matching Prisma enum
 */
export enum ConsentDocumentType {
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  RETURN_REFUND = 'RETURN_REFUND',
}

/**
 * DTO for recording user consent to legal documents
 */
export class RecordConsentDto {
  @ApiProperty({
    description: 'رقم الهاتف العراقي - Iraqi phone number',
    example: '07701234567',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^07[0-9]{9}$/, {
    message: 'رقم الهاتف يجب أن يكون بصيغة 07XXXXXXXXX',
  })
  phone: string;

  @ApiProperty({
    description: 'أنواع الوثائق الموافق عليها - Document types accepted',
    example: ['TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'RETURN_REFUND'],
    enum: ConsentDocumentType,
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(ConsentDocumentType, { each: true })
  documentTypes: ConsentDocumentType[];

  @ApiProperty({
    description: 'إصدار الوثيقة - Document version',
    example: '1.0',
  })
  @IsString()
  @IsNotEmpty()
  version: string;
}
