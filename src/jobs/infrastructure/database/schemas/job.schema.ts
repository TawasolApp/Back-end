import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EmploymentType } from '../../../enums/employment-type.enum';
import { LocationType } from '../../../enums/location-type.enum';
import { ExperienceLevel } from '../../../enums/experience-level.enum';

export type JobDocument = Job & Document;

@Schema({ timestamps: false, versionKey: false })
export class Job {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  //   @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  //   employer_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({ required: true })
  position: string;

  @Prop()
  salary: number;

  @Prop()
  description: string;

  @Prop({
    type: String,
    enum: Object.values(ExperienceLevel),
  })
  experience_level: ExperienceLevel;

  @Prop({
    type: String,
    enum: Object.values(LocationType),
    required: true,
  })
  location_type: LocationType;

  @Prop({
    type: String,
    enum: Object.values(EmploymentType),
    required: true,
  })
  employment_type: EmploymentType;

  @Prop()
  applicants: number;

  @Prop({ required: true })
  location: string;

  @Prop()
  application_link: string;

  @Prop()
  open: boolean;

  @Prop({
    type: String,
    default: () => new Date().toISOString(),
  })
  posted_at: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  saved_by: Types.ObjectId[];

  @Prop({ type: Boolean, default: false }) // Add isFlagged with default value false
  is_flagged: boolean;
}

export const JobSchema = SchemaFactory.createForClass(Job);

JobSchema.set('collection', 'Jobs');
