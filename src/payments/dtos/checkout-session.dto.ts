import { IsNotEmpty, IsEnum, IsBoolean, IsUrl } from 'class-validator';

export class CheckoutSessionDto {
  @IsNotEmpty()
  @IsUrl()
  checkoutSessionUrl: string;
}
