import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreatePostDto {
  @IsString()
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

  @IsString()
  @IsEnum(['User', 'Company'])
  readonly authorType: string;
}
