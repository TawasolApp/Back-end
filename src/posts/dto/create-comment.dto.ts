import { IsString, IsArray, ArrayNotEmpty, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  tagged?: string[];
}
