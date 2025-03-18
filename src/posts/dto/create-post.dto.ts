import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreatePostDto {
  @IsString()
  readonly authorId: string; // Add userId field

  @IsString()
  readonly text: string;

  @IsOptional()
  @IsArray()
  readonly media?: string[];

  @IsOptional()
  @IsArray()
  readonly taggedUsers?: string[];

  @IsString()
  @IsEnum(['Public', 'Connections', 'Private'])
  readonly visibility?: string;

}
