import { IsEmail, IsNotEmpty } from 'class-validator';
export class ResendConfirmationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
