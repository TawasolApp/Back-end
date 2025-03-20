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
} from 'class-validator';
import { CompanyType } from '../infrastructure/company-type.enum';

// add followers
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

  @IsNumber()
  @Min(1, { message: 'Employee count must be positive' })
  @IsOptional()
  employees?: number;

  @IsNumber()
  @IsOptional()
  followers?: number;

  @IsEnum(CompanyType)
  companyType: CompanyType;

  @IsString()
  @IsNotEmpty()
  industry: string;

  @IsString()
  @IsOptional()
  overview?: string;

  @IsNumber()
  @Min(1900, { message: 'Founded year must be valid' })
  founded: number;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsUrl()
  location: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  contactNumber?: string;
}
