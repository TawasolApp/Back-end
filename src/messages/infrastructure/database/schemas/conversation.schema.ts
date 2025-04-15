import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationSchema = Conversation & Document;

@Schema({
  timestamps: false,
  versionKey: false,
})
export class Conversation {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  participants: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Message', required: true })
  last_message_id: Types.ObjectId;

  @Prop()
  unseen_count: number;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.set('collection', 'Conversations');
