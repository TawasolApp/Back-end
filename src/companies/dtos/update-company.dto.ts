import {
  IsString,
  IsUrl,
  IsBoolean,
  IsNumber,
  IsEmail,
  IsOptional,
  Min,
  Max,
  IsEnum,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { CompanyType } from '../enums/company-type.enum';
import { CompanySize } from '../enums/company-size.enum';

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Name must not be empty' })
  readonly name?: string;

  @ValidateIf((dto) => dto.isVerified !== '' && dto.isVerified !== null)
  @IsBoolean()
  @IsOptional()
  readonly isVerified?: boolean;

  @ValidateIf((dto) => dto.logo !== '' && dto.logo !== null)
  @IsUrl()
  @IsOptional()
  readonly logo?: string;

  @ValidateIf((dto) => dto.banner !== '' && dto.banner !== null)
  @IsUrl()
  @IsOptional()
  readonly banner?: string;

  @ValidateIf((dto) => dto.description !== '' && dto.description !== null)
  @IsString()
  @IsOptional()
  readonly description?: string;

  @IsEnum(CompanySize)
  @IsOptional()
  @IsNotEmpty({ message: 'Company size must be set' })
  readonly companySize?: CompanySize;

  @IsEnum(CompanyType)
  @IsOptional()
  @IsNotEmpty({ message: 'Company type must be set' })
  readonly companyType?: CompanyType;

  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'Industry must not be empty' })
  readonly industry?: string;

  @ValidateIf((dto) => dto.overview !== '' && dto.overview !== null)
  @IsString()
  @IsOptional()
  readonly overview?: string;

  @ValidateIf((dto) => dto.founded !== null && dto.founded !== '')
  @IsNumber()
  @IsOptional()
  @Min(1900, { message: 'Founded year must be valid' })
  @Max(new Date().getFullYear(), { message: 'Founded year must be valid' })
  readonly founded?: number;

  @ValidateIf((dto) => dto.website !== '' && dto.website !== null)
  @IsUrl()
  @IsOptional()
  readonly website?: string;

  @ValidateIf((dto) => dto.address !== '' && dto.address !== null)
  @IsString()
  @IsOptional()
  readonly address?: string;

  @ValidateIf((dto) => dto.location !== '' && dto.location !== null)
  @IsUrl()
  @IsOptional()
  readonly location?: string;

  @ValidateIf((dto) => dto.email !== '' && dto.email !== null)
  @IsEmail()
  @IsOptional()
  readonly email?: string;

  @ValidateIf((dto) => dto.contactNumber !== '' && dto.contactNumber !== null)
  @IsString()
  @IsOptional()
  readonly contactNumber?: string;
}
