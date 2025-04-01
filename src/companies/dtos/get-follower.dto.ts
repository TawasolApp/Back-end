import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class GetFollowerDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsUrl()
  @IsOptional()
  profilePicture?: string;

  @IsString()
  @IsOptional()
  headline?: string;
}
