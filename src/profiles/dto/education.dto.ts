import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}
