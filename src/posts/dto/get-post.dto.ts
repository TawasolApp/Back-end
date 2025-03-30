import {
  IsString,
  IsArray,
  IsInt,
  IsBoolean,
  IsEnum,
  IsISO8601,
  ValidateNested,
  IsOptional,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Repost } from '../infrastructure/database/repost.schema';

export class GetPostDto {
  @IsString()
  id: string;

  @IsString()
  authorId: string;

  @IsString()
  authorName: string;

  @IsString()
  authorPicture: string;

  @IsString()
  authorBio: string;

  @IsString()
  content: string;

  @IsArray()
  @IsString({ each: true })
  media: string[];

  @IsObject()
  reactCounts: {
    Like: number;
    Love: number;
    Funny: number;
    Celebrate: number;
    Insightful: number;
    Support: number;
  };

  @IsInt()
  comments: number;

  @IsInt()
  shares: number;

  @IsArray()
  @IsString({ each: true })
  taggedUsers: string[];

  @IsEnum(['Public', 'Connections', 'Private'])
  visibility: 'Public' | 'Connections' | 'Private';

  @IsEnum(['User', 'Company'])
  authorType: 'User' | 'Company';

  @IsEnum(['Like', 'Love', 'Funny', 'Celebrate', 'Insightful', 'Support'])
  reactType:
    | 'Like'
    | 'Love'
    | 'Funny'
    | 'Celebrate'
    | 'Insightful'
    | 'Support'
    | null;

  @IsBoolean()
  isSaved: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => Repost)
  repostDetails?: Repost;

  @IsISO8601()
  timestamp: string; // ISO 8601 format
}
