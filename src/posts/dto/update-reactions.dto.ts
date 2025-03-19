import {
  IsObject,
  IsInt,
  Min,
  Max,
  IsBoolean,
  isEnum,
  IsEnum,
} from 'class-validator';

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

  @IsEnum(['Post', 'Comment'])
  postType: string;
}
