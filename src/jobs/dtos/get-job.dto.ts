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
  IsISO8601,
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
  @IsOptional()
  companyName?: string | null;

  @IsString()
  @IsOptional()
  companyLogo?: string | null;

  @IsString()
  @IsOptional()
  companyAddress?: string | null;

  @IsString()
  @IsOptional()
  companyDescription?: string | null;

  @IsString()
  @IsOptional()
  companyLocation?: string | null; // Keep the name as companyLocation

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  location: string;

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

  @IsNumber()
  @IsOptional()
  applicants: number;

  @IsBoolean()
  @IsNotEmpty()
  isOpen: boolean;

  @IsBoolean()
  @IsNotEmpty()
  isSaved: boolean;

  @IsBoolean()
  @IsNotEmpty()
  isFlagged: boolean;

  @IsString()
  @IsISO8601()
  @IsNotEmpty()
  postedAt: string;

  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus | null;
}
