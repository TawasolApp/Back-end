import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDate,
} from 'class-validator';

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  SELF_EMPLOYED = 'self_employed',
  FREELANCE = 'freelance',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  APPRENTICESHIP = 'apprenticeship',
}

export enum LocationType {
  ON_SITE = 'on_site',
  HYBRID = 'hybrid',
  REMOTE = 'remote',
}

export class WorkExperienceDto {
  @ApiProperty({ example: 'Software Engineer', description: 'The job title.' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'full_time',
    description: 'The type of employment.',
    enum: EmploymentType, // This will show the allowed values in Swagger
  })
  @IsEnum(EmploymentType, {
    message: `employmentType must be one of the following values: ${Object.values(EmploymentType).join(', ')}`,
  })
  @IsNotEmpty()
  employmentType: EmploymentType;

  @ApiProperty({ example: 'Google', description: 'The name of the company.' })
  @IsNotEmpty()
  @IsString()
  company: string;

  @ApiProperty({ example: '2020-09-01', description: 'The start date.' })
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({
    example: '2024-06-30',
    description: 'The end date (optional).',
  })
  @IsOptional()
  endDate?: Date;

  @ApiProperty({
    example: 'San Francisco, CA',
    description: 'The work location.',
  })
  @IsOptional()
  @IsString()
  location: string;

  @ApiProperty({
    example: 'remote',
    description: 'The work location type.',
    enum: LocationType,
  })
  @IsEnum(LocationType, {
    message: `locationType must be one of the following values: ${Object.values(LocationType).join(', ')}`,
  })
  @IsOptional()
  locationType: LocationType;

  @ApiProperty({
    example: 'Worked on various projects...',
    description: 'Job description (optional).',
  })
  @IsOptional()
  @IsString()
  description: string;
}
