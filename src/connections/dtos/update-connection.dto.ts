import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateConnectionDto {
  @IsBoolean()
  @IsNotEmpty()
  readonly isAccept: boolean;
}
