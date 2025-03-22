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

export class GetCompanyDto {
  @IsString()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @IsUrl()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CompanySize)
  @IsOptional()
  companySize?: CompanySize;

  @IsNumber()
  @IsNotEmpty()
  followers: number;

  @IsEnum(CompanyType)
  @IsOptional()
  companyType?: CompanyType;

  @IsString()
  @IsNotEmpty()
  industry: string;

  @IsString()
  @IsOptional()
  overview?: string;

  @IsNumber()
  @Min(1900, { message: 'Founded year must be valid' })
  @Max(new Date().getFullYear(), { message: 'Founded year must be valid' })
  @IsOptional()
  founded?: number;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsUrl()
  @IsOptional()
  location?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  contactNumber?: string;
}
