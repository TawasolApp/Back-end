import { IsString, IsEnum } from 'class-validator';

export enum ReportedType {
  User = 'Profile',
  Job = 'Post',
}

export class ReportRequestDto {
  @IsString()
  reported_id: string;

  @IsEnum(ReportedType)
  reported_type: ReportedType;

  @IsString()
  reason: string;
}
