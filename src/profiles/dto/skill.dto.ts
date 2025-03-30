import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmpty, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class SkillDto {
  @ApiPropertyOptional({
    description: 'skill name',
    example: 'python',
  })
  @IsNotEmpty()
  @IsString()
  skillName: string;

  @IsEmpty()
  endorsements?: Types.ObjectId[];
}
