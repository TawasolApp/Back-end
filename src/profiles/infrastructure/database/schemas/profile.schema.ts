import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  Visibility,
  EmploymentType,
  LocationType,
  PlanType,
} from '../enums/profile-enums';

export type ProfileDocument = Profile & Document;

@Schema({ _id: false })
export class Skill {
  @Prop({ required: true })
  skill_name: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  endorsements: Types.ObjectId[];
}

@Schema({ _id: false })
export class Education {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  school: string;

  @Prop()
  degree: string;

  @Prop()
  field: string;

  @Prop()
  start_date: Date;

  @Prop()
  end_date?: Date;

  @Prop()
  grade: string;

  @Prop()
  description: string;
}

@Schema({ _id: false })
export class Certification {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  company: string;

  @Prop()
  issue_date: Date;
}

@Schema({ _id: false })
export class WorkExperience {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({
    enum: [EmploymentType],
  })
  employment_type: EmploymentType;

  @Prop({ required: true })
  company: string;

  @Prop({ required: true })
  start_date: Date;

  @Prop()
  end_date?: Date;

  @Prop()
  location: string;

  @Prop({ enum: ['on_site', 'hybrid', 'remote'] })
  location_type: string;

  @Prop()
  description: string;
}

@Schema({ _id: false })
export class PlanDetails {
  @Prop({ enum: PlanType, default: 'monthly' })
  plan_type: PlanType;

  @Prop({ required: true })
  start_date: Date;

  @Prop({ required: true })
  expiry_date: Date;

  @Prop({ required: true })
  auto_renewal: boolean;

  @Prop()
  cancel_date?: Date;
}

@Schema({ _id: false })
export class PlanStatistics {
  @Prop({ required: true })
  message_count: number;

  @Prop({ required: true })
  application_count: number;
}

@Schema({ timestamps: false, versionKey: false })
export class Profile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  profile_picture: string;

  @Prop()
  cover_photo: string;

  @Prop()
  resume: string;

  @Prop()
  headline: string;

  @Prop()
  bio: string;

  @Prop()
  location: string;

  @Prop()
  industry: string;

  @Prop({ type: [Skill], default: undefined })
  skills?: Skill[];

  @Prop({ type: [Education], default: undefined })
  education?: Education[];

  @Prop({ type: [Certification], default: undefined })
  certification?: Certification[];

  @Prop({ type: [WorkExperience], default: undefined })
  work_experience?: WorkExperience[];

  @Prop({ enum: Visibility, default: 'public' })
  visibility: Visibility;

  @Prop()
  connection_count: number;

  @Prop({ type: PlanDetails })
  plan_details: PlanDetails;

  @Prop({
    type: PlanStatistics,
    required: true,
    default: { message_count: 0, application_count: 0 },
  })
  plan_statistics: PlanStatistics;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

ProfileSchema.set('collection', 'Profiles');
