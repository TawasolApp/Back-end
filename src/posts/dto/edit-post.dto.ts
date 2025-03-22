import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

export class EditPostDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly content?: string;

  @IsOptional()
  @IsArray()
  readonly media?: string[];

  @IsOptional()
  @IsArray()
  readonly taggedUsers?: string[];

  @IsOptional()
  @IsString()
  @IsEnum(['Public', 'Connections', 'Private'])
  readonly visibility?: string;
}
