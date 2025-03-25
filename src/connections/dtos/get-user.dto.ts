import { Expose, Transform } from 'class-transformer';
import {
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class GetUserDto {
  @Expose({ name: '_id' })
  @IsMongoId()
  userId: string;

  @Expose({ name: 'name' })
  @IsString()
  username: string;

  @Expose({ name: 'profile_picture' })
  @IsUrl()
  @IsOptional()
  profilePicture?: string;

  @Expose()
  @IsString()
  @IsOptional()
  headline?: string;

  // @Expose({ name: 'created_at' })
  // @Transform(({ value }) => new Date(value).toISOString(), { toClassOnly: true })
  // @IsISO8601()
  // @IsOptional()
  // createdAt?: string;
}
