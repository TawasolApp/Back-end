
import {  IsOptional, IsString } from 'class-validator';
import {  ApiPropertyOptional } from '@nestjs/swagger';
export class UpdateProfileDto {
    @ApiPropertyOptional({ description: 'name', example: 'johndoe' })
    @IsOptional()
    @IsString()
    name: string;
  
    @ApiPropertyOptional({ description: 'Profile picture URL', example: 'https://example.com/profile.jpg' })
    @IsOptional()
    @IsString()
    profile_picture?: string;
  
    @ApiPropertyOptional({ description: 'Cover photo URL', example: 'https://example.com/cover.jpg' })
    @IsOptional()
    @IsString()
    cover_photo?: string;
  
    @ApiPropertyOptional({ description: 'Resume URL', example: 'https://example.com/resume.pdf' })
    @IsOptional()
    @IsString()
    resume?: string;
  
    @ApiPropertyOptional({ description: 'Headline', example: 'Software Engineer at Google' })
    @IsOptional()
    @IsString()
    headline?: string;
  
    @ApiPropertyOptional({ description: 'Bio', example: 'Passionate about AI and cloud computing' })
    @IsOptional()
    @IsString()
    bio?: string;
  
    @ApiPropertyOptional({ description: 'Location', example: 'New York, USA' })
    @IsOptional()
    @IsString()
    location?: string;
  
    @ApiPropertyOptional({ description: 'Industry', example: 'Computer Software' })
    @IsOptional()
    @IsString()
    industry?: string;
    
}