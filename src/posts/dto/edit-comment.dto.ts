import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class EditCommentDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  content?: string;

  @IsString({ each: true })
  @IsOptional()
  tagged?: string[];
}
