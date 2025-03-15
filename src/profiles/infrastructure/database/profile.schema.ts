import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  company: string;

  @Prop()
  issue_date: Date;
}

@Schema({ _id: false })
export class WorkExperience {
  @Prop({ required: true })
  title: string;

  @Prop({
    enum: [
      'full_time',
      'part_time',
      'self_employed',
      'freelance',
      'contract',
      'internship',
      'apprenticeship',
    ],
  })
  employment_type: string;

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
class PlanDetails {
  @Prop({ enum: ['monthly', 'yearly'], default: 'monthly' })
  plan_type: string;

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
class PlanStatistics {
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
  username: string;

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

  @Prop({ type: [Skill], default: [] })
  skill: Skill[];

  @Prop({ type: [Education], default: [] })
  education: Education[];

  @Prop({ type: [Certification], default: [] })
  certification: Certification[];

  @Prop({ type: [WorkExperience], default: [] })
  work_experience: WorkExperience[];

  @Prop({ enum: ['public', 'private', 'connections_only'], default: 'public' })
  visibility: string;

  @Prop()
  connection_count: number;

  @Prop({ type: PlanDetails, required: true })
  plan_details: PlanDetails;

  @Prop({ type: PlanStatistics, required: true })
  plan_statistics: PlanStatistics;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

ProfileSchema.set('collection', 'Profiles');
