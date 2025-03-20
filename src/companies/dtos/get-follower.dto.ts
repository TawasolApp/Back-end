import { IsOptional, IsString, IsUrl } from 'class-validator';

export class GetFollowerDto {
  @IsString()
  userId: string;

  @IsString()
  username: string;

  @IsOptional()
  @IsUrl()
  profilePicture?: string;

  @IsString()
  headline: string;
}
