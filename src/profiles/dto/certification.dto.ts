import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CertificationDto {
  @ApiProperty({
    example: 'AWS Certified Solutions Architect',
    description: 'The name of the certification.',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'https://example.com/certification.jpg',
    description: 'The URL of the certification picture.',
  })
  @IsOptional()
  @IsString()
  certificationPicture?: string;

  @ApiProperty({
    example: 'Amazon Web Services',
    description: 'The company or organization that issued the certification.',
  })
  @IsNotEmpty()
  @IsString()
  company: string;

  @ApiProperty({
    example: '2024-06-15T00:00:00.000Z',
    description: 'The date when the certification was issued.',
  })
  @IsOptional()
  issueDate: Date;
}
