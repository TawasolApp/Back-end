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

  @Prop()
  position: string;

  @Prop()
  salary: number;

  @Prop({
    type: String,
    enum: Object.values(ExperienceLevel),
    required: true,
  })
  experience_level: ExperienceLevel;

  @Prop()
  description: string;

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

  @Prop()
  location: string;

  @Prop({
    type: String,
    default: () => new Date().toISOString(),
  })
  posted_at: string;
}

export const JobSchema = SchemaFactory.createForClass(Job);

JobSchema.set('collection', 'Jobs');
