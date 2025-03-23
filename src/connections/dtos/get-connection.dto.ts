import { IsString, IsUrl, IsOptional, IsNotEmpty, IsISO8601 } from 'class-validator';

export class GetConnectionDto {
  @IsString()
  readonly userId: string;

  @IsString()
  readonly username: string;

  @IsUrl()
  @IsOptional()
  readonly profilePicture?: string;

  @IsString()
  @IsOptional()
  readonly headline?: string;

  @IsISO8601()
  readonly createdAt: string;
}
