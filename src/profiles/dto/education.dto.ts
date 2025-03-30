import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EducationDto {
  @ApiProperty({
    example: 'Harvard University',
    description: 'The name of the school or university attended.',
  })
  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  school: string;

  @ApiProperty({
    example: 'Bachelor of Science',
    description: 'The degree obtained or pursued.',
  })
  @Prop()
  degree: string;

  @ApiProperty({
    example: 'Computer Science',
    description: 'The field of study.',
  })
  @Prop()
  field: string;

  @ApiProperty({
    example: '2020-09-01',
    description: 'The start date of the education period.',
  })
  @Prop()
  startDate: Date;

  @ApiProperty({
    example: '2024-06-30',
    description: 'The end date of the education period (optional).',
  })
  @Prop()
  endDate?: Date;

  @ApiProperty({
    example: '4.0',
    description: 'The grade or GPA achieved (optional).',
  })
  @Prop()
  grade: string;

  @ApiProperty({
    example: 'Graduated with honors.',
    description: 'A brief description of the education experience (optional).',
  })
  @Prop()
  description: string;
}
