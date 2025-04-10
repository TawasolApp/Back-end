import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResendConfirmationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  type: 'verifyEmail' | 'forgotPassword' | 'emailUpdate'; // Add type field
}
