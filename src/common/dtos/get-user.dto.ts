import {
  IsBoolean,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class GetUserDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsUrl()
  @IsOptional()
  profilePicture?: string;

  @IsUrl()
  @IsOptional()
  coverPhoto?: string;

  @IsString()
  @IsOptional()
  headline?: string;

  // only used for connections module (date of connection creation)
  @IsString()
  @IsISO8601()
  createdAt: string;

  @IsBoolean()
  @IsOptional()
  isConnected?: boolean;
}
