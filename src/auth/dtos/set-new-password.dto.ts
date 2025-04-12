import { IsNotEmpty, MinLength, IsEmail } from 'class-validator';

export class SetNewPassword {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword: string;
}
