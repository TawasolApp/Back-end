import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({
  timestamps: false,
  versionKey: false,
})
export class Conversation {
  @Prop({
    type: Types.ObjectId,
    auto: true,
    default: () => new Types.ObjectId(),
  })
  _id: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Profile' }], required: true })
  participants: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  last_message_id: Types.ObjectId;

  @Prop()
  unseen_count: number;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.set('collection', 'Conversations');
