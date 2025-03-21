import {
  IsString,
  IsArray,
  IsInt,
  IsISO8601,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

class ReplyDto {
  @IsString()
  authorId: string;

  @IsString()
  authorName: string;

  @IsString()
  authorPicture: string;

  @IsString()
  authorBio: string;

  @IsString()
  text: string;

  @IsInt()
  reactCount: number;

  @IsArray()
  @IsString({ each: true })
  taggedUsers: string[];
}

export class GetCommentDto {
  @IsString()
  id: string;

  @IsString()
  postId: string;

  @IsString()
  authorId: string;

  @IsString()
  authorName: string;

  @IsString()
  authorPicture: string;

  @IsString()
  authorBio: string;

  @IsEnum(['User', 'Company'])
  authorType: string;

  @IsString()
  content: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReplyDto)
  replies: ReplyDto[];

  @IsInt()
  reactCount: number;

  @IsISO8601()
  timestamp: string;

  @IsArray()
  @IsString({ each: true })
  taggedUsers: string[];

  @IsEnum(['Like', 'Love', 'Laugh', 'Clap', null])
  reactType: 'Like' | 'Love' | 'Laugh' | 'Clap' | null;
}
