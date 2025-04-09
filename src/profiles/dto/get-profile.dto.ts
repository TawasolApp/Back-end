import { SkillDto } from './skill.dto';
import { Types } from 'mongoose';
import { Skill } from '../infrastructure/database/schemas/profile.schema';
import { CertificationDto } from './certification.dto';
import {
  Visibility,
  EmploymentType,
  LocationType,
  PlanType,
  ProfileStatus,
} from '../enums/profile-enums';

class Education {
  _id: Types.ObjectId;

  school: string;

  degree?: string;

  field?: string;

  startDate?: string;

  endDate: string | null;

  grade?: string;

  description?: string;

  companyId?: Types.ObjectId;

  companyLogo?: string;
}

class Certification {
  _id: Types.ObjectId;

  name: string;

  company: string;

  companyId?: Types.ObjectId;

  companyLogo?: string;

  issueDate?: string;

  expiryDate?: string;
}

class WorkExperience {
  _id: Types.ObjectId;

  title: string;

  employmentType: EmploymentType;

  company: string;

  startDate: string;

  endDate: string | null;

  location?: string;

  locationType?: LocationType;

  description?: string;

  companyId?: Types.ObjectId;

  companyLogo?: string;
}

class PlanDetails {
  planType: PlanType;

  startDate: string;

  expiryDate: string;

  autoRenewal: boolean;

  cancelDate?: string;
}

class PlanStatistics {
  messageCount: number;

  applicationCount: number;
}

export class GetProfileDto {
  _id: Types.ObjectId;

  firstName: string;

  lastName: string;

  profilePicture?: string;

  coverPhoto?: string;

  resume?: string;

  headline?: string;

  bio?: string;

  location?: string;

  industry?: string;

  skills?: SkillDto[];

  education?: Education[];

  certification?: Certification[];

  workExperience?: WorkExperience[];

  visibility?: Visibility;

  connectionCount?: number;

  status?: ProfileStatus = ProfileStatus.ME;
}
