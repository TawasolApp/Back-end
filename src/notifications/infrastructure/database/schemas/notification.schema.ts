import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({
  timestamps: { createdAt: 'sent_at', updatedAt: false },
  versionKey: false,
})
export class Notification {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, refPath: 'reported_type' })
  reference_id: Types.ObjectId;

  @Prop({
    enum: ['React', 'Comment', 'Message', 'UserConnection'],
    required: true,
  })
  reference_type: string;

  @Prop()
  content: string;

  @Prop()
  seen: boolean;

  @Prop()
  sent_at: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.set('collection', 'Notifications');
