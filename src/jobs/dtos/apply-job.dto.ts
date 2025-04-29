import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class ApplyJobDto {
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  resumeURL?: string | ''; 
}
