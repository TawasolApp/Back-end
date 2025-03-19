import { IsString, IsNotEmpty } from 'class-validator';

export class RequestConnectionDto {
  @IsString()
  @IsNotEmpty()
  readonly userId: string;

  @IsString()
  @IsNotEmpty()
  readonly tempUserId: string;
}
