import { IsString, IsEnum } from 'class-validator';

export enum ReportedType {
  User = 'Profile',
  Job = 'Post',
}

export class ReportRequestDto {
  @IsString()
  reportedId: string;

  @IsEnum(ReportedType)
  reportedType: ReportedType;

  @IsString()
  reason: string;
}
