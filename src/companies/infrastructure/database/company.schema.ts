import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: false, versionKey: false })
export class Company {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  logo: string;

  @Prop({ required: true })
  industry: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  founded: number;

  @Prop()
  website: string;

  @Prop({ required: true })
  location: string;

  @Prop()
  email: string;

  @Prop()
  contact_number: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.set('collection', 'Companies');
