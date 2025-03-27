import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateRequestDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly userId: string;
}
