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

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsBoolean()
  @IsOptional()
  readonly verified?: boolean;

  @IsUrl()
  @IsOptional()
  readonly logo?: string;

  @IsString()
  @IsOptional()
  readonly description?: string;

  @IsNumber()
  @Min(1, { message: 'Employee count must be positive' })
  @IsOptional()
  readonly employees?: number;

  @IsEnum(CompanyType)
  readonly companyType: CompanyType;

  @IsString()
  @IsNotEmpty()
  readonly industry: string;

  @IsString()
  @IsOptional()
  readonly overview?: string;

  @IsNumber()
  @Min(1900, { message: 'Founded year must be valid' })
  readonly founded: number;

  @IsUrl()
  @IsOptional()
  readonly website?: string;

  @IsString()
  @IsOptional()
  readonly address?: string;

  @IsUrl()
  readonly location: string;

  @IsEmail()
  readonly email: string;

  @IsString()
  @IsOptional()
  readonly contactNumber?: string;
}
