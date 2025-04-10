import { IsNotEmpty, IsBoolean, IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsNotEmpty()
  @IsBoolean()
  isAndroid: boolean;
}
