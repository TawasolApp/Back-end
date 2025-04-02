import { IsNotEmpty, IsString } from 'class-validator';

export class AddEndoresementDto {
  @IsString()
  @IsNotEmpty()
  readonly skillName: string;
}
