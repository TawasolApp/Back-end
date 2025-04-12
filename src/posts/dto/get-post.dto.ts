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
import { PostDocument } from '../infrastructure/database/schemas/post.schema';

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

  @IsISO8601()
  timestamp: string; // ISO 8601 format

  @IsOptional()
  @IsString()
  parentPost?: GetPostDto; // Optional field for parent post ID

  @IsOptional()
  @IsBoolean()
  isSilentRepost?: boolean; // Optional field for silent repost

  @IsBoolean()
  isConnected: boolean; // Indicates if the post is from a connection

  @IsBoolean()
  isFollowing: boolean; // Indicates if the user is following the author

  @IsBoolean()
  isEdited: boolean; // Indicates if the post has been edited
}
