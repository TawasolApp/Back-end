import {
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
  IsEnum,
} from 'class-validator';

export class GetNotificationsDto {
  @IsOptional()
  @IsString()
  notificationId?: string;

  @IsOptional()
  @IsString()
  userName?: string; // User's name

  @IsOptional()
  @IsString()
  profilePicture?: string; // URL or path to the user's profile picture

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  rootItemId?: string; // ID of the root item (e.g., post, comment)

  @IsOptional()
  @IsEnum(['User', 'Company'])
  senderType?: 'User' | 'Company'; // Enum for sender type

  @IsOptional()
  @IsString()
  type?: 'React' | 'Comment' | 'UserConnection' | 'Message' | 'JobOffer';

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
