import { IsOptional, IsString, IsUrl } from "class-validator";

export class GetFollowerDto {
    @IsString()
    readonly userId: string;
  
    @IsString()
    readonly username: string;
  
    @IsOptional()
    @IsUrl()
    readonly profilePicture?: string;
  
    @IsString()
    readonly headline: string;
}