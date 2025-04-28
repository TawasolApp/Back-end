import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsISO8601,
} from 'class-validator';
import { ApplicationStatus } from '../enums/application-status.enum';

export class ApplicationDto {
  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @IsString()
  @IsNotEmpty()
  applicantId: string;

  @IsString()
  @IsOptional()
  applicantName?: string;

  @IsString()
  @IsOptional()
  applicantEmail?: string;

  @IsString()
  @IsOptional()
  applicantPicture?: string;

  @IsString()
  @IsOptional()
  applicantHeadline?: string;

  @IsString()
  @IsOptional()
  applicantPhoneNumber?: string;

  @IsString()
  @IsOptional()
  resumeURL?: string;

  @IsEnum(ApplicationStatus)
  @IsNotEmpty()
  status: ApplicationStatus;

  @IsString()
  @IsISO8601()
  @IsNotEmpty()
  appliedDate: string;
}
