import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class AddAccessDto {
  @IsMongoId()
  @IsString()
  @IsNotEmpty()
  readonly newUserId: string;
}
