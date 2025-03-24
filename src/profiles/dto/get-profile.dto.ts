import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SkillDto } from './skill.dto';
import { Skill } from '../infrastructure/database/profile.schema';
import { Types } from 'mongoose';

// class Skill {
//   @ApiProperty({ description: 'Name of the skill', example: 'JavaScript' })
//   @IsNotEmpty()
//   @IsString()
//   skillName: string;
// }

class Education {
    _id: Types.ObjectId;
  @ApiProperty({ description: 'Name of the educational institution', example: 'Harvard University' })
  @IsNotEmpty()
  @IsString()
  school: string;

  @ApiPropertyOptional({ description: 'Degree obtained', example: 'Bachelor of Science' })
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiPropertyOptional({ description: 'Field of study', example: 'Computer Science' })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional({ description: 'Start date', example: '2015-09-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date', example: '2019-06-01' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Grade obtained', example: '3.8/4.0' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ description: 'Additional details', example: 'Graduated with honors' })
  @IsOptional()
  @IsString()
  description?: string;
}

class Certification {
  @ApiProperty({ description: 'Name of the certification', example: 'AWS Certified Solutions Architect' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Issuing company', example: 'Amazon Web Services' })
  @IsNotEmpty()
  @IsString()
  company: string;

  @ApiPropertyOptional({ description: 'Issue date', example: '2021-01-15' })
  @IsOptional()
  @IsString()
  issueDate?: string;
}

class WorkExperience {

    _id: Types.ObjectId;

  @ApiProperty({ description: 'Job title', example: 'Software Engineer' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Employment type',
    example: 'full_time',
    enum: ['full_time', 'part_time', 'self_employed', 'freelance', 'contract', 'internship', 'apprenticeship'],
  })
  @IsNotEmpty()
  @IsEnum(['full_time', 'part_time', 'self_employed', 'freelance', 'contract', 'internship', 'apprenticeship'])
  employmentType: string;

  @ApiProperty({ description: 'Company name', example: 'Google' })
  @IsNotEmpty()
  @IsString()
  company: string;

  @ApiProperty({ description: 'Start date', example: '2020-01-01' })
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @ApiPropertyOptional({ description: 'End date', example: '2022-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Location', example: 'Mountain View, CA' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Location type',
    enum: ['on_site', 'hybrid', 'remote'],
    example: 'remote',
  })
  @IsOptional()
  @IsEnum(['on_site', 'hybrid', 'remote'])
  locationType?: string;

  @ApiPropertyOptional({ description: 'Job role description', example: 'Worked on AI projects' })
  @IsOptional()
  @IsString()
  description?: string;
}

class PlanDetails {
  @ApiProperty({
    description: 'Subscription plan type',
    example: 'monthly',
    enum: ['monthly', 'yearly'],
  })
  @IsNotEmpty()
  @IsEnum(['monthly', 'yearly'])
  planType: string;

  @ApiProperty({ description: 'Start date of the plan', example: '2023-01-01' })
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @ApiProperty({ description: 'Expiry date of the plan', example: '2023-12-31' })
  @IsNotEmpty()
  @IsString()
  expiryDate: string;

  @ApiProperty({ description: 'Whether the plan auto-renews', example: true })
  @IsNotEmpty()
  @IsBoolean()
  autoRenewal: boolean;

  @ApiPropertyOptional({ description: 'Cancel date of the plan', example: '2023-12-31' })
  @IsOptional()
  @IsString()
  cancelDate?: string;
}

class PlanStatistics {
  @ApiProperty({ description: 'Message count', example: 10 })
  
  messageCount: number;

  @ApiProperty({ description: 'Application count', example: 5 })

  applicationCount: number;
}

export class GetProfileDto {

  _id: Types.ObjectId;
  
  @ApiProperty({ description: 'name', example: 'ziad asar' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Profile picture URL', example: 'https://example.com/profile.jpg' })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiPropertyOptional({ description: 'Cover photo URL', example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  coverPhoto?: string;

  @ApiPropertyOptional({ description: 'Resume URL', example: 'https://example.com/resume.pdf' })
  @IsOptional()
  @IsString()
  resume?: string;

  @ApiPropertyOptional({ description: 'Headline', example: 'Software Engineer at Google' })
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional({ description: 'Bio', example: 'Passionate about AI and cloud computing' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Location', example: 'New York, USA' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Industry', example: 'Computer Software' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: 'Skills', type: [SkillDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills?: SkillDto[];

  @ApiPropertyOptional({ description: 'Education history', type: [Education] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Education)
  education?: Education[];

  @ApiPropertyOptional({ description: 'Certifications', type: [Certification] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Certification)
  certifications?: Certification[];

  @ApiPropertyOptional({ description: 'Work experience', type: [WorkExperience] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkExperience)
  workExperience?: WorkExperience[];

  @ApiPropertyOptional({
    description: 'Profile visibility',
    example: 'public',
    enum: ['public', 'private', 'connections_only'],
  })
  @IsOptional()
  @IsEnum(['public', 'private', 'connections_only'])
  visibility?: string;

  @ApiPropertyOptional({ description: 'Connection count', example: 50 })
  @IsOptional()
  connectionCount?: number;

 
}
