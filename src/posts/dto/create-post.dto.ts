import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreatePostDto {
  @IsString()
  readonly creator: string;

  @IsString()
  readonly text: string;

  @IsOptional()
  @IsArray()
  readonly media?: string[];

  @IsOptional()
  @IsArray()
  readonly tags?: string[];

  @IsString()
  @IsEnum(['Public', 'Connections', 'Private'])
  readonly visibility?: string;

  @IsString()
  @IsEnum(['User', 'Company'])
  readonly authorType: string;
}
