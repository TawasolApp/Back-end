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
  sender_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiver_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, refPath: 'reported_type' })
  item_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, refPath: 'reported_type' })
  root_item_id: Types.ObjectId;

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
