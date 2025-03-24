import { Expose, Transform } from 'class-transformer';
import { IsDate, IsISO8601, IsOptional, IsString, IsUrl } from 'class-validator';

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

  @Expose({ name: 'created_at' })
  @Transform(({ value }) => new Date(value).toISOString(), { toClassOnly: true })
  @IsISO8601()
  readonly createdAt?: string;
}