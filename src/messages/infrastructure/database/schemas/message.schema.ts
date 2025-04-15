import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MessageStatus } from '../../../enums/message-status.enum';

export type MessageDocument = Message & Document;

@Schema({
  timestamps: { createdAt: 'sent_at', updatedAt: false },
  versionKey: false,
})
export class Message {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversation_id: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop({ type: [String], default: [] })
  media: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  admin_id: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(MessageStatus),
  })
  status: MessageStatus;

  @Prop()
  sent_at: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.set('collection', 'Messages');
