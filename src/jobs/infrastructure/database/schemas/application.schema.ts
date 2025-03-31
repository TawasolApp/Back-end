import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApplicationStatus } from '../../../enums/application-status.enum';

export type ApplicationDocument = Application & Document;

@Schema({ timestamps: false, versionKey: false })
export class Application {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
  job_id: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ApplicationStatus),
  })
  status: ApplicationStatus;

  @Prop({
    type: String,
    default: () => new Date().toISOString(),
  })
  applied_at: string;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

ApplicationSchema.set('collection', 'Applications');
