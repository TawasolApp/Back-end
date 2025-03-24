import { IsNotEmpty } from 'class-validator';

export class SocialLoginDto {
  @IsNotEmpty()
  idToken: string;
}
