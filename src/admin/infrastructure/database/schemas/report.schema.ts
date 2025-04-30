import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReportStatus } from '../../../enums/report-status.enum';

export type ReportDocument = Report & Document;

@Schema({
  timestamps: { createdAt: 'reported_at', updatedAt: false },
  versionKey: false,
})
export class Report {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, refPath: 'reported_type' })
  reported_id: Types.ObjectId;

  @Prop({
    enum: ['Profile', 'Post'],
    required: true,
  })
  reported_type: string;

  @Prop({
    type: String,
    enum: ReportStatus,
  })
  status: ReportStatus;

  @Prop({ type: String, required: true })
  reason: string;

  @Prop()
  reported_at: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

ReportSchema.set('collection', 'Reports');
