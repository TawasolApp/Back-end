import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CompanyType } from '../company-type.enum';

import { CompanySize } from '../company-size.enum';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: false, versionKey: false })
export class Company {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true})
  name: string;

  @Prop()
  verified: boolean;;

  @Prop()
  logo: string;

  @Prop()
  banner: string;

  @Prop()
  description: string;;

  @Prop({
    type: String,
    enum: Object.values(CompanySize),
    required: true,
  })
  company_size: CompanySize;

  @Prop({
    type: String,
    enum: Object.values(CompanyType),
    required: true,
  })
  company_type: CompanyType;


  @Prop({ required: true })
  industry: string;

  @Prop()
  overview: string;

  @Prop()
  founded: number;

  @Prop({ unique: true })
  website: string;

  @Prop()
  address: string;;

 
  @Prop()
  location: string;

  @Prop({ unique: true })
  email: string;

  @Prop({ unique: true })
  contact_number: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.set('collection', 'Companies');
