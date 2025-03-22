import { IsOptional, IsString, IsUrl } from 'class-validator';

export class GetFollowerDto {
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
}
