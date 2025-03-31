import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDate } from 'class-validator';

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
    @Prop({ required: true })
    @IsNotEmpty()
    @IsString()
    title: string;
  
    @ApiProperty({
      example: 'full_time',
      description: 'The type of employment.',
      enum: EmploymentType, // This will show the allowed values in Swagger
    })
    @Prop({
      enum: EmploymentType,
    })
    @IsEnum(EmploymentType, {
        message: `employmentType must be one of the following values: ${Object.values(EmploymentType).join(', ')}`,
      })
      
    employmentType: EmploymentType;
  
    @ApiProperty({ example: 'Google', description: 'The name of the company.' })
    @Prop({ required: true })
    @IsNotEmpty()
    @IsString()
    company: string;
  
    @ApiProperty({ example: '2020-09-01', description: 'The start date.' })
    @Prop({ required: true })
    startDate: Date;
  
    @ApiProperty({ example: '2024-06-30', description: 'The end date (optional).' })
    @Prop()
    endDate?: Date;
  
    @ApiProperty({ example: 'San Francisco, CA', description: 'The work location.' })
    @Prop()
    location: string;
  
    @ApiProperty({
      example: 'remote',
      description: 'The work location type.',
      enum: LocationType,
    })
    @Prop({
      enum: LocationType,
    })
    @IsEnum(LocationType, {
      message: `locationType must be one of the following values: ${Object.values(LocationType).join(', ')}`,
    })
    locationType: LocationType;
  
    @ApiProperty({ example: 'Worked on various projects...', description: 'Job description (optional).' })
    @Prop()
    description: string;
  }