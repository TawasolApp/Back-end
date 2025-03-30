import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CertificationDto {
  @ApiProperty({
    example: 'AWS Certified Solutions Architect',
    description: 'The name of the certification.',
  })
  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Amazon Web Services',
    description: 'The company or organization that issued the certification.',
  })
  @IsNotEmpty()
  @IsString()
  @Prop({ required: true })
  company: string;

  @ApiProperty({
    example: '2024-06-15T00:00:00.000Z',
    description: 'The date when the certification was issued.',
  })
  
  @Prop()
  issueDate: Date;
}
