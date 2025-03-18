import { IsObject, IsInt, Min, Max, IsBoolean } from 'class-validator';

export class Reactions {
  @IsBoolean()
  Like: boolean;

  @IsBoolean()
  Love: boolean;

  @IsBoolean()
  Laugh: boolean;

  @IsBoolean()
  Clap: boolean;
}

export class UpdateReactionsDto {
  @IsObject()
  reactions: Reactions;
}
