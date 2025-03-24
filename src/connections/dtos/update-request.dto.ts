import { IsBoolean, IsNotEmpty } from "class-validator";

export class UpdateRequestDto {
  @IsBoolean()
  @IsNotEmpty()
  readonly isAccept: boolean;
}