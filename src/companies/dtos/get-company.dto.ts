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
import { CompanyType } from '../enums/company-type.enum';
import { CompanySize } from '../enums/company-size.enum';

export class GetCompanyDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsNotEmpty()
  isFollowing: boolean;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @IsUrl()
  @IsOptional()
  logo?: string;

  @IsUrl()
  @IsOptional()
  banner?: string;

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
