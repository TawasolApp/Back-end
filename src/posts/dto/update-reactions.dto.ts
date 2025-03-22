import { IsObject, IsBoolean, IsEnum } from 'class-validator';

export class Reactions {
  @IsBoolean()
  Like: boolean;

  @IsBoolean()
  Love: boolean;

  @IsBoolean()
  Funny: boolean;

  @IsBoolean()
  Celebrate: boolean;

  @IsBoolean()
  Insightful: boolean;

  @IsBoolean()
  Support: boolean;
}

export class UpdateReactionsDto {
  @IsObject()
  reactions: Reactions;

  @IsEnum(['Post', 'Comment'])
  postType: string;
}
