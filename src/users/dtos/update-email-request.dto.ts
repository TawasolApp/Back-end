import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class UpdateEmailRequestDto {
  @IsEmail()
  newEmail: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
