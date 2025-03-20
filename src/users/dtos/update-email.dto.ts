import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class UpdateEmailDto {
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;  // 🔹 Require current password for verification
}
