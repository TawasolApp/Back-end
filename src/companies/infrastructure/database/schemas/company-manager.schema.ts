import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CompanyManagerDocument = CompanyManager & Document;

@Schema({
  timestamps: false,
  versionKey: false,
})
export class CompanyManager {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  manager_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({
    type: String,
    default: () => new Date().toISOString(),
  })
  created_at: string;
}

export const CompanyManagerSchema =
  SchemaFactory.createForClass(CompanyManager);

CompanyManagerSchema.set('collection', 'CompanyManagers');
