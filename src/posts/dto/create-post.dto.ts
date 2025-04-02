import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  readonly content: string;

  @IsOptional()
  @IsArray()
  readonly media?: string[];
  @IsOptional()
  @IsArray()
  readonly taggedUsers?: string[];

  @IsString()
  @IsEnum(['Public', 'Connections', 'Private'])
  readonly visibility?: string;

  @IsOptional()
  @IsString()
  readonly parentPostId?: string;

  @IsOptional()
  @IsBoolean()
  readonly isSilentRepost?: boolean;
}
