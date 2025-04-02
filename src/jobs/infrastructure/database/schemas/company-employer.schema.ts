import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CompanyEmployerDocument = CompanyEmployer & Document;

@Schema({
  timestamps: false,
  versionKey: false,
})
export class CompanyEmployer {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  employer_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({
    type: String,
    default: () => new Date().toISOString(),
  })
  created_at: string;
}

export const CompanyEmployerSchema =
  SchemaFactory.createForClass(CompanyEmployer);

CompanyEmployerSchema.set('collection', 'CompanyEmployers');
