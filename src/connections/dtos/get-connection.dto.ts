import { IsString, IsUrl, IsOptional, IsNotEmpty, IsISO8601 } from 'class-validator';

export class GetConnectionDto {
  @IsString()
  readonly userId: string;

  @IsString()
  readonly username: string;

  @IsOptional()
  @IsUrl()
  readonly profilePicture?: string;

  @IsString()
  readonly headline: string;

  @IsISO8601()
  readonly createdAt: string;
}
