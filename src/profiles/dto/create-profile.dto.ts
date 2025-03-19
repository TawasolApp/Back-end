import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class Education {
  @ApiProperty({
    description: 'Name of the educational institution',
    example: 'Harvard University',
  })
  @IsNotEmpty()
  @IsString()
  school: string;

     

  @ApiPropertyOptional({
    description: 'Degree obtained',
    example: 'Bachelor of Science in Computer Science',
  })
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiPropertyOptional({
    description: 'Field of study',
    example: 'Computer Science',
  })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional({
    description: 'Start date of the education',
    example: '2015-09-01',
  })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date of the education (optional, if still studying)',
    example: '2019-06-01',
  })
  @IsOptional()
  @IsString()
  end_date?: string;

  @ApiProperty({
    description: 'Grade or GPA obtained',
    example: '3.8/4.0',
  })
  @IsNotEmpty()
  @IsString()
  grade: string;   

  @ApiPropertyOptional({
    description: 'Additional details about the education',
    example: 'Graduated with honors',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

class Certification {
  @ApiProperty({
    description: 'Name of the certification',
    example: 'AWS Certified Solutions Architect',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Organization that issued the certification',
    example: 'Amazon Web Services',
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({
    description: 'Date the certification was issued',
    example: '2021-01-15',
  })
  @IsOptional()
  @IsString()
  issue_date?: string;

 
}

class WorkExperience {
  @ApiProperty({
    description: 'Job title',
    example: 'Software Engineer',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Name of the company',
    example: 'Google',
  })
  @IsNotEmpty()
  @IsString()
  company: string;

  @ApiPropertyOptional({
    description: 'Location of the job',
    example: 'Mountain View, CA',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Start date of the job',
    example: '2020-01-01',
  })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date of the job (optional, if still working)',
    example: '2022-12-31',
  })
  @IsOptional()
  @IsString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Description of the job role',
    example: 'Developed scalable web applications using React and Node.js.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

class PlanDetails {
  @ApiProperty({
    description: 'Plan type the user is subscribed to',
    example: 'monthly',
  })
  @IsNotEmpty()
  @IsString()
  plan_type: string;

  @ApiPropertyOptional({
    description: 'Start date of the plan',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date of the plan',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsString()
  expiry_date?: string;

  @ApiPropertyOptional({
    description: 'Start date of the plan',
    example: 'true' ,
  })
  @IsOptional()
  @IsString()
  auto_renewal?: string;

  @ApiPropertyOptional({
    description: 'cancel date of the plan',
    example: '2023-12-31',	
  })
  @IsOptional()
  @IsString()
  cancel_date?: boolean;

  
}

export class CreateProfileDto {
  @ApiProperty({
    description: 'The username of the user',
    example: 'johndoe',
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiPropertyOptional({
    description: 'Biography or description of the user',
    example: 'Passionate software engineer with 5 years of experience in web development.',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Headline or tagline of the user',
    example: 'headline',
  })
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional({
    description: 'URL or path to the cover photo',
    example: 'https://example.com/images/cover.jpg',
  })
  @IsOptional()
  @IsString()
  profile_picture?: string;

  @ApiPropertyOptional({
    description: 'URL or path to the cover photo',
    example: 'https://example.com/images/cover.jpg',
  })
  @IsOptional()
  @IsString()
  cover_photo?: string;

  @ApiPropertyOptional({
    description: 'industries the user is interested in',
    example: 'Computer Software',
  })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({
    description: 'Location of the user',
    example: 'Sheikh-Zayed',
  })
  @IsOptional()
  @IsString()
  location?: string;



  @ApiPropertyOptional({
    description: 'List of education entries',
    type: [Education],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Education)
  education?: Education[];

  @ApiPropertyOptional({
    description: 'List of certifications',
    type: [Certification],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Certification)
  certification?: Certification[];

  @ApiPropertyOptional({
    description: 'List of work experience entries',
    type: [WorkExperience],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkExperience)
  work_experience?: WorkExperience[];

  @ApiPropertyOptional({
    description: 'Visibility settings for the profile',
    example: 'public',
    enum: ['public', 'private', 'connections_only'],
  })
  @IsOptional()
  @IsString()
  visibility?: string;

  @ApiPropertyOptional({
    description: 'Details of the user\'s subscription plan',
    type: PlanDetails,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlanDetails)
  plan_details?: PlanDetails;
}