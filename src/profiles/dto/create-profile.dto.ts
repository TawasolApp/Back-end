import { Types } from 'mongoose';
import {
  Skill,
  Education,
  WorkExperience,
  Certification,
  PlanDetails,
  PlanStatistics,
} from '../infrastructure/database/profile.schema';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProfileDto {
  @IsNotEmpty()
  @IsString()   
  username: string;
  @IsString()   
  profile_picture?: string;
  @IsString()   
  cover_photo?: string;
  @IsString()   
  resume?: string;
  @IsString()   
  headline?: string;
  @IsString()   
  bio?: string;
  @IsString()      
  location?: string;
  @IsString()   
  industry?: string;

  skill?: Skill[];

  education?: Education[];

  certification?: Certification[];

  work_experience?: WorkExperience[];

  visibility?: string;

  

  plan_details?: PlanDetails;

  
}
