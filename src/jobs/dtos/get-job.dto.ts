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
import { ExperienceLevel } from '../enums/experience-level.enum';
import { EmploymentType } from '../enums/employment-type.enum';
import { LocationType } from '../enums/location-type.enum';
import { ApplicationStatus } from '../enums/application-status.enum';

// TODO: add companyId only or add company details?
export class GetJobDto {
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  location: string

  @IsEnum(ExperienceLevel)
  @IsOptional()
  experienceLevel?: ExperienceLevel;

  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @IsEnum(LocationType)
  @IsOptional()
  locationType?: LocationType;

  @IsUrl()
  @IsOptional()
  applicationLink?: string;

  // only display for posting company
  @IsNumber()
  @IsOptional()
  applicants: number;

  // TODO: add postedAt field 
}
