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

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  participants: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  last_message_id: Types.ObjectId;

  @Prop()
  unseen_count: number;

  @Prop({
    type: [
      {
        user_id: { type: Types.ObjectId, ref: 'User' },
        markedAsUnread: { type: Boolean, default: false },
      },
    ],
    default: function () {
      return (
        this.participants?.slice(0, 2).map((participant: Types.ObjectId) => ({
          user_id: participant,
          markedAsUnread: false,
        })) || []
      );
    },
  })
  read_status: {
    user_id: Types.ObjectId;
    markedAsUnread: boolean;
  }[];
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.set('collection', 'Conversations');
