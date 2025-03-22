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
import { CompanySize } from '../infrastructure/company-size.enum';

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  readonly name?: string;

  @IsBoolean()
  @IsOptional()
  readonly isVerified?: boolean;

  @IsUrl()
  @IsOptional()
  readonly logo?: string;

  @IsString()
  @IsOptional()
  readonly description?: string;

  @IsEnum(CompanySize)
  @IsOptional()
  readonly companySize?: CompanySize;

  @IsEnum(CompanyType)
  @IsOptional()
  readonly companyType?: CompanyType;

  @IsString()
  @IsOptional()
  readonly industry?: string;

  @IsString()
  @IsOptional()
  readonly overview?: string;

  @IsNumber()
  @IsOptional()
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
