import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CompanyConnectionDocument = CompanyConnection & Document;

@Schema({
  timestamps: false,
  versionKey: false,
})
export class CompanyConnection {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({
    type: String,
    default: () => new Date().toISOString(),
  })
  created_at: string;
}

export const CompanyConnectionSchema =
  SchemaFactory.createForClass(CompanyConnection);

CompanyConnectionSchema.set('collection', 'CompanyConnections');
