import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CompanyType } from '../company-type.enum';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: false, versionKey: false })
export class Company {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  verified: boolean;

  @Prop()
  logo: string;

  @Prop()
  followers: number;

  @Prop()
  employees: number;

  @Prop({
    type: String,
    enum: Object.values(CompanyType),
    required: true,
  })
  company_type: CompanyType;

  @Prop({ required: true })
  industry: string;

  @Prop({ required: true })
  overview: string;

  @Prop()
  founded: number;

  @Prop()
  website: string;

  @Prop()
  address: string;

  @Prop({ required: true })
  location: string;

  @Prop()
  description: string;

  @Prop()
  since: Date;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.set('collection', 'Companies');
