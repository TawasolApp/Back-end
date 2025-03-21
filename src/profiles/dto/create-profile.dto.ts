import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class Skill {
  @ApiProperty({ description: 'Name of the skill', example: 'JavaScript' })
  @IsNotEmpty()
  @IsString()
  skill_name: string;
}

class Education {
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
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date', example: '2019-06-01' })
  @IsOptional()
  @IsString()
  end_date?: string;

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
  issue_date?: string;
}

class WorkExperience {
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
  employment_type: string;

  @ApiProperty({ description: 'Company name', example: 'Google' })
  @IsNotEmpty()
  @IsString()
  company: string;

  @ApiProperty({ description: 'Start date', example: '2020-01-01' })
  @IsNotEmpty()
  @IsString()
  start_date: string;

  @ApiPropertyOptional({ description: 'End date', example: '2022-12-31' })
  @IsOptional()
  @IsString()
  end_date?: string;

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
  location_type?: string;

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
  plan_type: string;

  @ApiProperty({ description: 'Start date of the plan', example: '2023-01-01' })
  @IsNotEmpty()
  @IsString()
  start_date: string;

  @ApiProperty({ description: 'Expiry date of the plan', example: '2023-12-31' })
  @IsNotEmpty()
  @IsString()
  expiry_date: string;

  @ApiProperty({ description: 'Whether the plan auto-renews', example: true })
  @IsNotEmpty()
  @IsBoolean()
  auto_renewal: boolean;

  @ApiPropertyOptional({ description: 'Cancel date of the plan', example: '2023-12-31' })
  @IsOptional()
  @IsString()
  cancel_date?: string;
}

class PlanStatistics {
  @ApiProperty({ description: 'Message count', example: 10 })
  
  message_count: number;

  @ApiProperty({ description: 'Application count', example: 5 })

  application_count: number;
}

export class CreateProfileDto {
  @ApiProperty({ description: 'name', example: 'ziad asar' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Profile picture URL', example: 'https://example.com/profile.jpg' })
  @IsOptional()
  @IsString()
  profile_picture?: string;

  @ApiPropertyOptional({ description: 'Cover photo URL', example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  cover_photo?: string;

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

  @ApiPropertyOptional({ description: 'Skills', type: [Skill] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Skill)
  skills?: Skill[];

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
  work_experience?: WorkExperience[];

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
  connection_count?: number;

  @ApiPropertyOptional({ description: 'Plan details', type: PlanDetails })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlanDetails)
  plan_details?: PlanDetails;

  @ApiProperty({ description: 'Plan statistics', type: PlanStatistics })
  
  @ValidateNested()
  @Type(() => PlanStatistics)
  plan_statistics: PlanStatistics;
}
