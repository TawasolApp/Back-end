import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class EducationDto {
  @ApiProperty({
    example: 'Harvard University',
    description: 'The name of the school or university attended.',
  })
  @IsNotEmpty()
  @IsString()
  school: string;

  @ApiProperty({
    example: 'Bachelor of Science',
    description: 'The degree obtained or pursued.',
  })
  @IsOptional()
  @IsString()
  degree: string;

  @ApiProperty({
    example: 'Computer Science',
    description: 'The field of study.',
  })
  @IsOptional()
  field: string;

  @ApiProperty({
    example: '2020-09-01',
    description: 'The start date of the education period.',
  })
  @IsOptional()
  startDate: Date;

  @ApiProperty({
    example: '2024-06-30',
    description: 'The end date of the education period (optional).',
  })
  @IsOptional()
  endDate?: Date;

  @ApiProperty({
    example: '4.0',
    description: 'The grade or GPA achieved (optional).',
  })
  @IsOptional()
  grade: string;

  @ApiProperty({
    example: 'Graduated with honors.',
    description: 'A brief description of the education experience (optional).',
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    example: '60d5f484b3a8c8a3f4e5f4e5',
    description: 'The ID of the company that you had this education at.',
  })
  @IsOptional()
  companyId?: Types.ObjectId;

  @ApiProperty({
    example: 'https://example.com/certification.jpg',
    description: 'The URL of the company logo.',
  })
  @IsOptional()
  @IsString()
  companyLogo?: string;
}
