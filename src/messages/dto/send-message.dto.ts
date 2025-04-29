// Consider using DTOs with class-validator
import { IsString, IsOptional, IsArray } from 'class-validator';
export class SendMessageDto {
  @IsString()
  receiverId: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsArray()
  media?: string[];
}
