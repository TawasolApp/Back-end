import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUrl,
  Min,
} from 'class-validator';
import { ExperienceLevel } from '../enums/experience-level.enum';
import { EmploymentType } from '../enums/employment-type.enum';
import { LocationType } from '../enums/location-type.enum';

export class PostJobDto {
  @IsString()
  @IsNotEmpty()
  readonly position: string;

  @IsNumber()
  @Min(1, { message: 'Salary must be a positive number' })
  @IsOptional()
  readonly salary?: number;

  @IsString()
  @IsOptional()
  readonly description?: string;

  @IsEnum(ExperienceLevel)
  @IsOptional()
  readonly experienceLevel?: ExperienceLevel;

  @IsEnum(EmploymentType)
  @IsNotEmpty()
  readonly employmentType: EmploymentType;

  @IsEnum(LocationType)
  @IsNotEmpty()
  readonly locationType: LocationType;

  @IsString()
  @IsNotEmpty()
  readonly location: string;

  @IsUrl()
  @IsOptional()
  readonly applicationLink?: string;
}
