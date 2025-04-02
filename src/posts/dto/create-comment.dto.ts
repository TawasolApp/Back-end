import {
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  tagged?: string[];

  @IsBoolean()
  @IsOptional()
  isReply?: boolean = false; // Default value is false
}
