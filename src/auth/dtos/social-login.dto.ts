import { IsNotEmpty, IsBoolean, IsString } from 'class-validator';

export class SocialLoginDto {
  @IsNotEmpty()
  @IsString()
  idToken: string;

  @IsNotEmpty()
  @IsBoolean()
  isAndroid: boolean; // Reverted from is_android to isAndroid
}
