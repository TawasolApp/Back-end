import {
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  tagged?: string[];
}
