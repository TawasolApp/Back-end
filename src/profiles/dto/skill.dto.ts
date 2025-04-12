import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SkillDto {
  @ApiPropertyOptional({
    description: 'skill name',
    example: 'python',
  })
  @IsNotEmpty()
  @IsString()
  skillName: string;

  @ApiPropertyOptional({
    description: 'Where did you learn this skill? (e.g. work, school, etc.)',
    example: 'school',
  })
  @IsOptional()
  @IsString()
  position?: string;
}
