import {
  IsString,
  IsArray,
  IsInt,
  IsISO8601,
  ValidateNested,
  IsEnum,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsString({ each: true })
  repliesCount: number;

  @IsObject()
  reactCounts: {
    Like: number;
    Love: number;
    Funny: number;
    Celebrate: number;
    Insightful: number;
    Support: number;
  };

  @IsISO8601()
  timestamp: string;

  @IsArray()
  @IsString({ each: true })
  taggedUsers: string[];

  @IsEnum(['Like', 'Love', 'Funny', 'Celebrate', 'Insightful', 'Support', null])
  reactType:
    | 'Like'
    | 'Love'
    | 'Funny'
    | 'Celebrate'
    | 'Insightful'
    | 'Support'
    | null;

  @IsBoolean()
  isConnected: boolean;

  @IsBoolean()
  isFollowing: boolean;

  @IsBoolean()
  isEdited: boolean; // Indicates if the comment has been edited
}
