import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class GetCompaniesDto {
  @IsString()
  readonly companyId: string;

  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsUrl()
  @IsOptional()
  readonly logo?: string;

  @IsNumber()
  readonly followers?: number;
}
