import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsBoolean,
  IsNumber,
  IsEmail,
  IsOptional,
  Min,
  IsEnum,
  Max,
} from 'class-validator';
import { CompanyType } from '../infrastructure/company-type.enum';
import { CompanySize } from '../infrastructure/company-size.enum';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsUrl()
  @IsOptional()
  readonly logo?: string;

  @IsUrl()
  @IsOptional()
  readonly banner?: string;

  @IsString()
  @IsOptional()
  readonly description?: string;

  @IsEnum(CompanySize)
  @IsNotEmpty()
  readonly companySize: CompanySize;

  @IsEnum(CompanyType)
  @IsNotEmpty()
  readonly companyType: CompanyType;

  @IsString()
  @IsNotEmpty()
  readonly industry: string;

  @IsString()
  @IsOptional()
  readonly overview?: string;

  @IsNumber()
  @IsOptional()
  @Min(1900, { message: 'Founded year must be valid' })
  @Max(new Date().getFullYear(), { message: 'Founded year must be valid' })
  readonly founded?: number;

  @IsUrl()
  @IsOptional()
  readonly website?: string;

  @IsString()
  @IsOptional()
  readonly address?: string;

  @IsUrl()
  @IsOptional()
  readonly location?: string;

  @IsEmail()
  @IsOptional()
  readonly email?: string;

  @IsString()
  @IsOptional()
  readonly contactNumber?: string;
}
