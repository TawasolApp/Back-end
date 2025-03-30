import { ApiPropertyOptional } from '@nestjs/swagger';
import {  IsNotEmpty, IsString } from 'class-validator';


export class SkillDto {
  @ApiPropertyOptional({
    description: 'skill name',
    example: 'python',
  })
  @IsNotEmpty()
  @IsString()
  skillName: string;

 
}
